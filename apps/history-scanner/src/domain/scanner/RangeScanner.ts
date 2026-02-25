import { CheckPointGenerator } from '../check-point/CheckPointGenerator';
import { inject, injectable } from 'inversify';
import { Logger } from 'logger';
import { err, ok, Result } from 'neverthrow';
import { ExceptionLogger } from 'exception-logger';
import { BucketScanState, CategoryScanState } from './ScanState';
import { HttpQueue, Url } from 'http-helper';
import * as http from 'http';
import * as https from 'https';
import { CategoryScanner, CategoryScanResult } from './CategoryScanner';
import { BucketScanner, BucketScanResult } from './BucketScanner';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../scan/ScanError';
import { LedgerHeader } from './Scanner';
import { TYPES } from '../../infrastructure/di/di-types';
import { VerificationError } from './CategoryVerificationService';
import { Category } from '../history-archive/Category';

export interface RangeScanResult {
	latestLedgerHeader?: LedgerHeader;
	scannedBucketHashes: Set<string>;
	errors: ScanError[];
	exitCode: number | null; // null for TypeScript scanner
}
/**
 * Scan a specific range of a history archive
 */
@injectable()
export class RangeScanner {
	constructor(
		private checkPointGenerator: CheckPointGenerator,
		private categoryScanner: CategoryScanner,
		private bucketScanner: BucketScanner,
		@inject(TYPES.HttpQueue) private httpQueue: HttpQueue,
		@inject('Logger') private logger: Logger,
		@inject(TYPES.ExceptionLogger) private exceptionLogger: ExceptionLogger
	) {}

	async scan(
		baseUrl: Url,
		concurrency: number,
		toLedger: number,
		fromLedger: number,
		latestScannedLedger: number,
		latestScannedLedgerHeaderHash: string | null = null,
		alreadyScannedBucketHashes = new Set<string>()
	): Promise<Result<RangeScanResult, ScanError>> {
		this.logger.info('Starting range scan', {
			history: baseUrl.value,
			toLedger: toLedger,
			fromLedger: fromLedger,
			concurrency: concurrency
		});

		const allErrors: ScanError[] = [];

		const httpAgent = new http.Agent({
			keepAlive: true,
			scheduling: 'fifo'
		});
		const httpsAgent = new https.Agent({
			keepAlive: true,
			scheduling: 'fifo'
		});

		const hasScanState = new CategoryScanState(
			baseUrl,
			concurrency,
			httpAgent,
			httpsAgent,
			this.checkPointGenerator.generate(fromLedger, toLedger),
			new Map<number, string>(),
			latestScannedLedgerHeaderHash !== null
				? {
						ledger: latestScannedLedger,
						hash: latestScannedLedgerHeaderHash
					}
				: undefined
		);

		const bucketHashesOrError =
			await this.scanHASFilesAndReturnBucketHashes(hasScanState);

		// HAS scan failure is critical - we can't continue without bucket hashes
		if (bucketHashesOrError.isErr()) {
			httpAgent.destroy();
			httpsAgent.destroy();
			return err(bucketHashesOrError.error);
		}
		const bucketHashesToScan = bucketHashesOrError.value.bucketHashes;

		const categoryScanState = new CategoryScanState(
			baseUrl,
			concurrency,
			httpAgent,
			httpsAgent,
			this.checkPointGenerator.generate(fromLedger, toLedger),
			bucketHashesOrError.value.bucketListHashes,
			latestScannedLedgerHeaderHash
				? {
						ledger: latestScannedLedger,
						hash: latestScannedLedgerHeaderHash
					}
				: undefined
		);
		const categoryScanResult = await this.scanCategories(categoryScanState);

		let latestLedgerHeader: LedgerHeader | undefined;

		if (categoryScanResult.isErr()) {
			// Category scan had a fatal error (connection failure, etc.)
			httpAgent.destroy();
			httpsAgent.destroy();
			return err(categoryScanResult.error);
		}

		// Collect verification errors from category scan
		const categoryErrors = this.convertVerificationErrorsToScanErrors(
			categoryScanResult.value.errors,
			baseUrl
		);
		allErrors.push(...categoryErrors);
		latestLedgerHeader = categoryScanResult.value.latestLedgerHeader;

		const bucketScanState = new BucketScanState(
			baseUrl,
			concurrency,
			httpAgent,
			httpsAgent,
			new Set(
				Array.from(bucketHashesToScan).filter(
					(hashToScan) => !alreadyScannedBucketHashes.has(hashToScan)
				)
			)
		);

		const bucketScanResult = await this.scanBucketFiles(bucketScanState);

		if (bucketScanResult.isErr()) {
			// Bucket scan had a fatal error (connection failure, etc.)
			httpAgent.destroy();
			httpsAgent.destroy();
			return err(bucketScanResult.error);
		}

		// Collect bucket verification errors
		allErrors.push(...bucketScanResult.value.errors);

		httpAgent.destroy();
		httpsAgent.destroy();

		return ok({
			latestLedgerHeader,
			scannedBucketHashes: new Set([
				...bucketScanState.bucketHashesToScan,
				...alreadyScannedBucketHashes
			]),
			errors: allErrors,
			exitCode: null // TypeScript scanner doesn't have exit codes
		});
	}

	private convertVerificationErrorsToScanErrors(
		verificationErrors: VerificationError[],
		baseUrl: Url
	): ScanError[] {
		return verificationErrors.map((verificationError) => {
			const category = this.mapCategoryToScanErrorCategory(
				verificationError.category
			);
			return new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				baseUrl.value,
				verificationError.message,
				1,
				category,
				verificationError.ledger,
				verificationError.ledger
			);
		});
	}

	private mapCategoryToScanErrorCategory(
		category: Category
	): ScanErrorCategory {
		switch (category) {
			case Category.transactions:
				return ScanErrorCategory.TRANSACTION_SET_HASH;
			case Category.results:
				return ScanErrorCategory.TRANSACTION_RESULT_HASH;
			case Category.ledger:
				return ScanErrorCategory.LEDGER_HEADER_HASH;
			default:
				return ScanErrorCategory.OTHER;
		}
	}

	private async scanHASFilesAndReturnBucketHashes(
		scanState: CategoryScanState
	): Promise<
		Result<
			{
				bucketHashes: Set<string>;
				bucketListHashes: Map<number, string>;
			},
			ScanError
		>
	> {
		this.logger.info('Scanning HAS files');
		console.time('HAS');

		const scanHASResult =
			await this.categoryScanner.scanHASFilesAndReturnBucketHashes(scanState);

		if (scanHASResult.isErr()) {
			return err(scanHASResult.error);
		}

		console.timeEnd('HAS');

		return ok(scanHASResult.value);
	}

	private async scanBucketFiles(
		scanState: BucketScanState
	): Promise<Result<BucketScanResult, ScanError>> {
		console.time('bucket');
		this.logger.info(`Scanning ${scanState.bucketHashesToScan.size} buckets`);

		const scanBucketsResult = await this.bucketScanner.scan(scanState, true);
		console.timeEnd('bucket');

		return scanBucketsResult;
	}

	private async scanCategories(
		scanState: CategoryScanState
	): Promise<Result<CategoryScanResult, ScanError>> {
		console.time('category');
		this.logger.info('Scanning other category files');

		const scanOtherCategoriesResult =
			await this.categoryScanner.scanOtherCategories(scanState, true);

		console.timeEnd('category');

		return scanOtherCategoriesResult;
	}
}
