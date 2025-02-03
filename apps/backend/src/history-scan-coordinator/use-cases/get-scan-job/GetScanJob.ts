import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import { TYPES } from '../../infrastructure/di/di-types';
import { err, ok, Result } from 'neverthrow';
import { ScanJobDTO } from 'history-scanner-dto';
import { Logger } from 'logger';
import { ScanJobRepository } from '../../domain/ScanJobRepository';
import { mapUnknownToError } from '../../../core/utilities/mapUnknownToError';

/**
 * Schedules new scan jobs for history archives based on a configured scheduling strategy.
 * */
@injectable()
export class GetScanJob {
	constructor(
		@inject(TYPES.ScanJobRepository)
		private scanJobRepository: ScanJobRepository,
		@inject('ExceptionLogger') private exceptionLogger: ExceptionLogger,
		@inject('Logger') private logger: Logger
	) {}

	public async execute(): Promise<Result<ScanJobDTO | null, Error>> {
		try {
			const nextScanJob = await this.scanJobRepository.fetchNextJob();

			if (nextScanJob === null) {
				this.logger.info('No scan jobs available', {
					app: 'history-scan-coordinator'
				});

				return ok(null);
			}

			this.logger.info('Returning next scan job', {
				app: 'history-scan-coordinator',
				url: nextScanJob.url,
				chainInitDate: nextScanJob.chainInitDate
			});

			nextScanJob.status = 'TAKEN';
			await this.scanJobRepository.save([nextScanJob]);

			return ok({
				chainInitDate: nextScanJob.chainInitDate,
				url: nextScanJob.url,
				latestScannedLedger: nextScanJob.latestScannedLedger,
				latestScannedLedgerHeaderHash: nextScanJob.latestScannedLedgerHeaderHash
			});
		} catch (e) {
			const error = mapUnknownToError(e);
			this.exceptionLogger.captureException(error);
			return err(error);
		}
	}
}
