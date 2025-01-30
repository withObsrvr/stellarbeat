import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import { TYPES } from '../../infrastructure/di/di-types';
import { HistoryArchiveRepository } from '../../domain/HistoryArchiveRepository';
import { err, ok, Result } from 'neverthrow';
import { ScanScheduler } from '../../domain/ScanScheduler';
import { ScanJobDTO } from 'history-scanner-dto';
import { Logger } from 'logger';

/**
 * Schedules new scan jobs for history archives based on a configured scheduling strategy.
 * */
@injectable()
export class GetScanJob {
	private scanJobQueue: ScanJobDTO[] = []; //Optimization: could be stored in a database or queue

	constructor(
		@inject(TYPES.HistoryArchiveScanRepository)
		private scanRepository: ScanRepository,
		@inject(TYPES.HistoryArchiveRepository)
		private historyArchiveRepository: HistoryArchiveRepository,
		@inject(TYPES.ScanScheduler)
		private scanScheduler: ScanScheduler,
		@inject('ExceptionLogger') private exceptionLogger: ExceptionLogger,
		@inject('Logger') private logger: Logger
	) {}

	public async execute(): Promise<Result<ScanJobDTO | null, Error>> {
		if (this.scanJobQueue.length === 0) {
			await this.scheduleScanJobs();
		}

		const nextScanJob = this.scanJobQueue.shift();

		if (nextScanJob === undefined) {
			this.logger.warn('No scan jobs could be scheduled', {
				app: 'history-scan-coordinator'
			});
			return ok(null);
		}

		this.logger.info('Returning next scan job', {
			app: 'history-scan-coordinator',
			url: nextScanJob.url,
			chainInitDate: nextScanJob.chainInitDate
		});

		return ok(nextScanJob);
	}

	private async scheduleScanJobs() {
		const historyArchiveUrlsResult =
			await this.historyArchiveRepository.getHistoryArchiveUrls();
		if (historyArchiveUrlsResult.isErr()) {
			this.exceptionLogger.captureException(historyArchiveUrlsResult.error);
			return err(historyArchiveUrlsResult.error);
		}

		const previousScans = await this.scanRepository.findLatest();
		this.scanJobQueue.push(
			...this.scanScheduler.schedule(
				historyArchiveUrlsResult.value,
				previousScans
			)
		);

		this.logger.info('Scheduling new scan jobs', {
			app: 'history-scan-coordinator',
			historyArchiveUrls: historyArchiveUrlsResult.value,
			fullScans: this.scanJobQueue
				.filter((job) => job.chainInitDate === null)
				.map((job) => job.url)
		});
	}
}
