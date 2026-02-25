import { injectable } from 'inversify';
import { Result } from 'neverthrow';
import { Url } from 'http-helper';
import { ScanError } from '../scan/ScanError';
import { IRangeScanner, RangeScanResult } from './IRangeScanner';
import { RangeScanner } from './RangeScanner';

export interface RangeScannerSettings {
	concurrency: number;
	latestScannedLedger: number;
	latestScannedLedgerHeaderHash: string | null;
	alreadyScannedBucketHashes: Set<string>;
}

/**
 * Adapter that wraps RangeScanner to implement IRangeScanner interface.
 * This allows the TypeScript-based RangeScanner to be used interchangeably
 * with ArchivistRangeScanner through a common interface.
 */
@injectable()
export class RangeScannerAdapter implements IRangeScanner {
	constructor(
		private rangeScanner: RangeScanner,
		private settings: RangeScannerSettings
	) {}

	async scan(
		baseUrl: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<RangeScanResult, ScanError>> {
		const result = await this.rangeScanner.scan(
			baseUrl,
			this.settings.concurrency,
			toLedger,
			fromLedger,
			this.settings.latestScannedLedger,
			this.settings.latestScannedLedgerHeaderHash,
			this.settings.alreadyScannedBucketHashes
		);

		// Map the internal RangeScanResult to IRangeScanner's RangeScanResult
		return result.map((internalResult) => ({
			latestLedgerHeader: internalResult.latestLedgerHeader,
			errors: internalResult.errors,
			exitCode: internalResult.exitCode
		}));
	}

	/**
	 * Update settings for subsequent scans.
	 * This is useful when scanning multiple ranges in sequence.
	 */
	updateSettings(settings: Partial<RangeScannerSettings>): void {
		this.settings = { ...this.settings, ...settings };
	}
}
