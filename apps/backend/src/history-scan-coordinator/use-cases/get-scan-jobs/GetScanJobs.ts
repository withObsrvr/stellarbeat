import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import { TYPES } from '../../infrastructure/di/di-types';
import { HistoryArchiveRepository } from '../../domain/HistoryArchiveRepository';
import { err, ok, Result } from 'neverthrow';
import { ScanScheduler } from '../../domain/ScanScheduler';
import { ScanJob } from '../../domain/ScanJob';

/**
 * Schedules new scan jobs for history archives based on a configured scheduling strategy.
 * At the moment the strategy is basic, but could be expanded to support multiple scanners.
 * */
@injectable()
export class GetScanJobs {
	constructor(
		@inject(TYPES.HistoryArchiveScanRepository)
		private scanRepository: ScanRepository,
		@inject(TYPES.HistoryArchiveRepository)
		private historyArchiveRepository: HistoryArchiveRepository,
		@inject(TYPES.ScanScheduler)
		private scanScheduler: ScanScheduler,
		@inject('ExceptionLogger') private exceptionLogger: ExceptionLogger
	) {}

	public async execute(): Promise<Result<ScanJob[], Error>> {
		const historyArchiveUrlsResult =
			await this.historyArchiveRepository.getHistoryArchiveUrls();
		if (historyArchiveUrlsResult.isErr()) {
			this.exceptionLogger.captureException(historyArchiveUrlsResult.error);
			return err(historyArchiveUrlsResult.error);
		}

		const previousScans = await this.scanRepository.findLatest();
		const scanJobs = this.scanScheduler.schedule(
			historyArchiveUrlsResult.value,
			previousScans
		);

		return ok(scanJobs);
	}
}
