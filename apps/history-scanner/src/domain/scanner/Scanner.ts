import { inject, injectable } from 'inversify';
import { Logger } from 'logger';
import { Scan } from '../scan/Scan';
import { ExceptionLogger } from 'exception-logger';
import {
	ArchivistRangeScanner,
	ArchivistRangeScanResult
} from './ArchivistRangeScanner';
import { ScanJob } from '../scan/ScanJob';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../scan/ScanError';
import { ScanSettingsFactory } from '../scan/ScanSettingsFactory';
import { ScanSettings } from '../scan/ScanSettings';
import { ScanResult } from '../scan/ScanResult';
import { Url } from 'http-helper';
import { TYPES } from '../../infrastructure/di/di-types';
import { Result } from 'neverthrow';

export interface LedgerHeader {
	ledger: number;
	hash?: string;
}

@injectable()
export class Scanner {
	private readonly maxRetries = 3;
	private readonly baseRetryDelayMs = 30000; // 30 seconds

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
			let rangeResult = await this.rangeScanner.scan(
				url,
				rangeFromLedger,
				rangeToLedger
			);
			console.timeEnd('range_scan');

			// Check for connection error (exit code 2)
			const isConnectionError =
				rangeResult.isErr() ||
				(rangeResult.isOk() && rangeResult.value.exitCode === 2);

			if (isConnectionError) {
				this.logger.warn('Connection error detected, attempting retries', {
					url: url.value,
					fromLedger: rangeFromLedger,
					toLedger: rangeToLedger
				});

				rangeResult = await this.retryRangeScan(
					url,
					rangeFromLedger,
					rangeToLedger
				);

				// Check if retries failed
				if (
					rangeResult.isErr() ||
					(rangeResult.isOk() && rangeResult.value.exitCode === 2)
				) {
					// Retries failed - abort scan
					this.logger.error('Aborting scan due to persistent connection error', {
						url: url.value,
						fromLedger: rangeFromLedger
					});

					return {
						latestLedgerHeader,
						errors: [
							new ScanError(
								ScanErrorType.TYPE_CONNECTION,
								url.value,
								`Scan aborted: connection failed at ledger range ${rangeFromLedger}-${rangeToLedger}`,
								1,
								ScanErrorCategory.CONNECTION
							)
						]
					};
				}
			}

			if (rangeResult.isOk()) {
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

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async retryRangeScan(
		url: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<ArchivistRangeScanResult, ScanError>> {
		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			const delay = this.baseRetryDelayMs * Math.pow(2, attempt - 1);
			this.logger.info('Retrying range scan after connection error', {
				url: url.value,
				fromLedger,
				toLedger,
				attempt,
				delayMs: delay
			});

			await this.sleep(delay);
			const result = await this.rangeScanner.scan(url, fromLedger, toLedger);

			// Check if this attempt succeeded (not a connection error)
			if (result.isOk() && result.value.exitCode !== 2) {
				return result;
			}

			// If result is an error (not just exit code 2), log it
			if (result.isErr()) {
				this.logger.warn('Retry attempt failed with error', {
					url: url.value,
					attempt,
					error: result.error.message
				});
			}
		}

		// All retries failed - return connection error
		this.logger.error('All retry attempts failed', {
			url: url.value,
			fromLedger,
			toLedger,
			attempts: this.maxRetries
		});

		// Return the last failed result to preserve any error details
		return this.rangeScanner.scan(url, fromLedger, toLedger);
	}
}
