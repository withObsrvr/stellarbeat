import { Url } from 'http-helper';
import { Scanner } from '../../domain/scanner/Scanner';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { ExceptionLogger } from 'exception-logger';
import { mapUnknownToError } from 'shared';
import { Scan } from '../../domain/scan/Scan';
import { asyncSleep } from 'shared';
import { ScanScheduler } from '../../domain/scanner/ScanScheduler';
import { VerifyArchivesDTO } from './VerifyArchivesDTO';
import { ScanJob } from '../../domain/scan/ScanJob';
import { HistoryArchiveRepository } from '../../domain/history-archive/HistoryArchiveRepository';
import { JobMonitor } from 'job-monitor';

export class VerifyArchives {
	constructor(
		private scanner: Scanner,
		private scanRepository: ScanRepository,
		private historyArchiveService: HistoryArchiveRepository,
		private scanScheduler: ScanScheduler,
		private exceptionLogger: ExceptionLogger,
		private jobMonitor: JobMonitor
	) {}

	public async execute(verifyArchivesDTO: VerifyArchivesDTO): Promise<void> {
		const shutDown = false; //todo: implement graceful shutdown
		do {
			try {
				const historyArchivesOrError =
					await this.historyArchiveService.getHistoryArchiveUrls();
				if (historyArchivesOrError.isErr()) {
					this.exceptionLogger.captureException(historyArchivesOrError.error);
					await asyncSleep(60 * 60000); //maybe temporary db connection error
					continue;
				}

				await this.scanArchives(
					historyArchivesOrError.value,
					verifyArchivesDTO.persist
				);
			} catch (e) {
				this.exceptionLogger.captureException(mapUnknownToError(e));
				await asyncSleep(60 * 60000);
			}
		} while (!shutDown && verifyArchivesDTO.loop);
	}

	private async scanArchives(archives: Url[], persist = false) {
		const previousScans = await this.scanRepository.findLatest();
		const scanJobs = this.scanScheduler.schedule(archives, previousScans);
		console.log(scanJobs);
		for (const scanJob of scanJobs) {
			await this.checkIn('in_progress');
			await this.perform(scanJob, persist);
			await this.checkIn('ok');
		}
	}

	private async perform(scanJob: ScanJob, persist = false) {
		const scan = await this.scanner.perform(new Date(), scanJob);
		console.log(scan);
		//todo: logger
		if (persist) await this.persist(scan);
	}

	private async persist(scan: Scan) {
		try {
			await this.scanRepository.save([scan]);
		} catch (e: unknown) {
			this.exceptionLogger.captureException(mapUnknownToError(e));
		}
	}

	private async checkIn(status: 'in_progress' | 'error' | 'ok') {
		const result = await this.jobMonitor.checkIn({
			context: 'verify-archive',
			status
		});

		if (result.isErr()) {
			this.exceptionLogger.captureException(result.error);
		}
	}
}
