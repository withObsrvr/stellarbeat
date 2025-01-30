import { Scanner } from '../../domain/scanner/Scanner';
import { ScanCoordinatorService } from '../../domain/scan/ScanCoordinatorService';
import { ExceptionLogger } from 'exception-logger';
import { mapUnknownToError } from 'shared';
import { Scan } from '../../domain/scan/Scan';
import { asyncSleep } from 'shared';
import { VerifyArchivesDTO } from './VerifyArchivesDTO';
import { ScanJob } from '../../domain/scan/ScanJob';
import { JobMonitor } from 'job-monitor';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../infrastructure/di/di-types';
import { ScanJobDTO } from 'history-scanner-dto';

@injectable()
export class VerifyArchives {
	constructor(
		private scanner: Scanner,
		@inject(TYPES.ScanCoordinatorService)
		private scanCoordinator: ScanCoordinatorService,
		@inject(TYPES.ExceptionLogger)
		private exceptionLogger: ExceptionLogger,
		@inject(TYPES.JobMonitor)
		private jobMonitor: JobMonitor
	) {}

	public async execute(verifyArchivesDTO: VerifyArchivesDTO): Promise<void> {
		const shutDown = false; //todo: implement graceful shutdown
		do {
			try {
				const scanJobDTOResult = await this.scanCoordinator.getScanJob();
				if (scanJobDTOResult.isErr()) {
					this.exceptionLogger.captureException(scanJobDTOResult.error);
					await asyncSleep(60 * 1000); //maybe temporary db connection error
					continue;
				}

				await this.performScanJob(
					scanJobDTOResult.value,
					verifyArchivesDTO.persist
				);
			} catch (e) {
				//general catch all in case we missed an edge case
				this.exceptionLogger.captureException(mapUnknownToError(e));
				await asyncSleep(60 * 1000);
			}
		} while (!shutDown && verifyArchivesDTO.loop);
	}

	private async performScanJob(dto: ScanJobDTO, persist = false) {
		const scanJobResult = ScanJob.fromScanJobCoordinatorDTO(dto);
		if (scanJobResult.isErr()) {
			this.exceptionLogger.captureException(scanJobResult.error);
			return;
		}
		await this.checkIn('in_progress');
		await this.perform(scanJobResult.value, persist);
		await this.checkIn('ok');
	}

	private async perform(scanJob: ScanJob, persist = false) {
		const scan = await this.scanner.perform(new Date(), scanJob);
		console.log(scan);
		//todo: logger
		if (persist) await this.persist(scan);
	}

	private async persist(scan: Scan) {
		try {
			await this.scanCoordinator.registerScan(scan);
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
