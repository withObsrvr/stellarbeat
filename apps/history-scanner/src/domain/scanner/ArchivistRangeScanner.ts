import { inject, injectable } from 'inversify';
import { Logger } from 'logger';
import { err, ok, Result } from 'neverthrow';
import { Url } from 'http-helper';
import { ScanError } from '../scan/ScanError';
import { LedgerHeader } from './Scanner';
import { TYPES } from '../../infrastructure/di/di-types';
import { StellarArchivistVerifier } from './StellarArchivistVerifier';
import { ExceptionLogger } from 'exception-logger';

export interface ArchivistRangeScanResult {
	latestLedgerHeader?: LedgerHeader;
	errors: ScanError[];
}

/**
 * Scan a specific range of a history archive using stellar-archivist
 * This replaces the streaming verification with subprocess-based verification
 */
@injectable()
export class ArchivistRangeScanner {
	constructor(
		private archivistVerifier: StellarArchivistVerifier,
		@inject('Logger') private logger: Logger,
		@inject(TYPES.ExceptionLogger) private exceptionLogger: ExceptionLogger
	) {}

	async scan(
		baseUrl: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<ArchivistRangeScanResult, ScanError>> {
		this.logger.info('Starting archivist range scan', {
			history: baseUrl.value,
			toLedger: toLedger,
			fromLedger: fromLedger
		});

		const verificationResult = await this.archivistVerifier.verify(
			baseUrl,
			fromLedger,
			toLedger
		);

		if (verificationResult.isErr()) {
			return err(verificationResult.error);
		}

		const result = verificationResult.value;

		return ok({
			latestLedgerHeader: {
				ledger: result.latestVerifiedLedger,
				hash: undefined // stellar-archivist doesn't provide header hashes
			},
			errors: result.errors
		});
	}
}
