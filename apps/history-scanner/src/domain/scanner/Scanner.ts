import { inject, injectable } from 'inversify';
import { Logger } from 'logger';
import { Scan } from '../scan/Scan';
import { ExceptionLogger } from 'exception-logger';
import { ArchivistRangeScanner } from './ArchivistRangeScanner';
import { ScanJob } from '../scan/ScanJob';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../scan/ScanError';
import { ScanSettingsFactory } from '../scan/ScanSettingsFactory';
import { ScanSettings } from '../scan/ScanSettings';
import { ScanResult } from '../scan/ScanResult';
import { Url } from 'http-helper';
import { TYPES } from '../../infrastructure/di/di-types';

export interface LedgerHeader {
	ledger: number;
	hash?: string;
}

@injectable()
export class Scanner {
	constructor(
		private rangeScanner: ArchivistRangeScanner,
		private scanJobSettingsFactory: ScanSettingsFactory,
		@inject('Logger') private logger: Logger,
		@inject(TYPES.ExceptionLogger) private exceptionLogger: ExceptionLogger,
		private readonly rangeSize = 1000000
	) {}

	async perform(time: Date, scanJob: ScanJob): Promise<Scan> {
		const scanTimerLabel = `scan:${scanJob.url.value}`;
		console.time(scanTimerLabel);

		this.logger.info('Starting scan', {
			url: scanJob.url.value,
			isStartOfChain: scanJob.isNewScanChainJob(),
			chainInitDate: scanJob.chainInitDate
		});

		const scanSettingsOrError =
			await this.scanJobSettingsFactory.determineSettings(scanJob);

		if (scanSettingsOrError.isErr()) {
			console.timeEnd(scanTimerLabel);
			const error = scanSettingsOrError.error;
			return scanJob.createFailedScanCouldNotDetermineSettings(
				time,
				new Date(),
				error
			);
		}

		const scanSettings = scanSettingsOrError.value;

		this.logger.info('Scan settings', {
			url: scanJob.url.value,
			fromLedger: scanSettings.fromLedger,
			toLedger: scanSettings.toLedger,
			concurrency: scanSettings.concurrency,
			isSlowArchive: scanSettings.isSlowArchive
		});

		const scanResult = await this.scanInRanges(scanJob.url, scanSettings);
		const scan = scanJob.createScanFromScanResult(
			time,
			new Date(),
			scanSettings,
			scanResult
		);
		console.timeEnd(scanTimerLabel);

		return scan;
	}

	private async scanInRanges(
		url: Url,
		scanSettings: ScanSettings
	): Promise<ScanResult> {
		const latestLedgerHeader: LedgerHeader = {
			ledger: scanSettings.latestScannedLedger,
			hash: scanSettings.latestScannedLedgerHeaderHash ?? undefined
		};

		let rangeFromLedger = scanSettings.fromLedger;
		let rangeToLedger =
			rangeFromLedger + this.rangeSize < scanSettings.toLedger
				? rangeFromLedger + this.rangeSize
				: scanSettings.toLedger;

		const allErrors: ScanError[] = [];

		while (rangeFromLedger < scanSettings.toLedger) {
			console.time('range_scan');
			const rangeResult = await this.rangeScanner.scan(
				url,
				rangeFromLedger,
				rangeToLedger
			);
			console.timeEnd('range_scan');

			if (rangeResult.isErr()) {
				allErrors.push(rangeResult.error);
				// Continue scanning to collect more errors
			} else {
				// Collect any verification errors from the range
				// Note: Using concat instead of push(...) to avoid stack overflow with large error arrays
				for (const error of rangeResult.value.errors) {
					allErrors.push(error);
				}

				latestLedgerHeader.ledger = rangeResult.value.latestLedgerHeader
					? rangeResult.value.latestLedgerHeader.ledger
					: rangeToLedger;
				latestLedgerHeader.hash = rangeResult.value.latestLedgerHeader?.hash;
			}

			rangeFromLedger += this.rangeSize;
			rangeToLedger =
				rangeFromLedger + this.rangeSize < scanSettings.toLedger
					? rangeFromLedger + this.rangeSize
					: scanSettings.toLedger;
		}

		return {
			latestLedgerHeader,
			errors: this.aggregateErrors(allErrors, url.value)
		};
	}

	/**
	 * Aggregates errors by category to avoid duplicate error entries.
	 * Errors of the same category are combined into a single error with summed counts.
	 */
	private aggregateErrors(errors: ScanError[], baseUrl: string): ScanError[] {
		if (errors.length === 0) return [];

		// Separate connection errors (TYPE_CONNECTION) from verification errors
		const connectionErrors = errors.filter(
			(e) => e.type === ScanErrorType.TYPE_CONNECTION
		);
		const verificationErrors = errors.filter(
			(e) => e.type === ScanErrorType.TYPE_VERIFICATION
		);

		// If there's any connection error, just return the first one
		// (connection errors typically mean the scan couldn't proceed)
		if (connectionErrors.length > 0) {
			return [connectionErrors[0]];
		}

		// Aggregate verification errors by category
		const aggregations = new Map<
			ScanErrorCategory,
			{ count: number; message: string }
		>();

		for (const error of verificationErrors) {
			const existing = aggregations.get(error.category);
			if (existing) {
				existing.count += error.count;
			} else {
				aggregations.set(error.category, {
					count: error.count,
					message: error.message
				});
			}
		}

		// Convert aggregations to ScanError array
		const aggregatedErrors: ScanError[] = [];
		for (const [category, agg] of aggregations) {
			// Build a descriptive message based on the category
			const message = this.buildAggregatedMessage(category, agg.count);
			aggregatedErrors.push(
				new ScanError(
					ScanErrorType.TYPE_VERIFICATION,
					baseUrl,
					message,
					agg.count,
					category
				)
			);
		}

		return aggregatedErrors;
	}

	private buildAggregatedMessage(
		category: ScanErrorCategory,
		count: number
	): string {
		const categoryNames: Record<ScanErrorCategory, string> = {
			[ScanErrorCategory.TRANSACTION_SET_HASH]: 'transaction set hash mismatch',
			[ScanErrorCategory.TRANSACTION_RESULT_HASH]:
				'transaction result hash mismatch',
			[ScanErrorCategory.LEDGER_HEADER_HASH]: 'ledger header hash mismatch',
			[ScanErrorCategory.BUCKET_HASH]: 'bucket hash mismatch',
			[ScanErrorCategory.MISSING_FILE]: 'missing file',
			[ScanErrorCategory.CONNECTION]: 'connection error',
			[ScanErrorCategory.OTHER]: 'verification error'
		};

		const categoryName = categoryNames[category];
		const plural = count === 1 ? '' : 's';
		return `${count} ${categoryName}${plural}`;
	}
}
