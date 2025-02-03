import 'reflect-metadata';
import { ok, Result } from 'neverthrow';
import { ScheduleScansDTO as ScheduleScanJobsDTO } from './ScheduleScanJobsDTO';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../infrastructure/di/di-types';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { ScanScheduler } from '../../domain/ScanScheduler';
import { Logger } from 'logger';
import { ScanJobRepository } from '../../domain/ScanJobRepository';

/**
 * Schedule scansJobs and adds them to the queue. If the scan queue is empty, new ScanJobs will be created.
 * Could be improved in the future to check if a scan is already pending for a given url.
 * For now we will only create new ScanJobs if the queue is empty.
 *
 * Make sure that only 1 process calls this usecase to avoid race conditions.
 * At the moment the network-scanner, and more in particular, the node-scanner calls this use-case
 *
 * To avoid any race conditions, this could be periodically called with a cronjob
 */
@injectable()
export class ScheduleScanJobs {
	constructor(
		@inject(TYPES.HistoryArchiveScanRepository)
		private scanRepository: ScanRepository,
		@inject(TYPES.ScanJobRepository)
		private scanJobRepository: ScanJobRepository,
		@inject(TYPES.ScanScheduler)
		private scanScheduler: ScanScheduler,
		@inject('Logger') private logger: Logger
	) {}

	public async execute(dto: ScheduleScanJobsDTO): Promise<Result<void, Error>> {
		if (await this.isQueueEmpty()) {
			await this.scheduleScanJobs(dto);
		}

		return ok(undefined);
	}

	private async isQueueEmpty(): Promise<boolean> {
		return !(await this.scanJobRepository.hasPendingJobs());
	}

	private async scheduleScanJobs(dto: ScheduleScanJobsDTO): Promise<void> {
		const previousScans = await this.scanRepository.findLatest();
		const scanJobs = this.scanScheduler.schedule(
			dto.historyArchiveUrls,
			previousScans
		);

		this.logger.info('Scheduling new scan jobs', {
			app: 'history-scan-coordinator',
			historyArchiveUrls: dto.historyArchiveUrls,
			fullScans: scanJobs
				.filter((job) => job.chainInitDate === null)
				.map((job) => job.url)
		});

		await this.scanJobRepository.save(scanJobs);
	}
}
