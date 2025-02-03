import { HistoryArchiveScanService } from '../../domain/node/scan/history/HistoryArchiveScanService';
import { ScanRepository } from '../../../history-scan-coordinator/domain/scan/ScanRepository';
import { err, ok, Result } from 'neverthrow';
import { mapUnknownToError } from '../../../core/utilities/mapUnknownToError';
import { inject, injectable } from 'inversify';
import { HistoryArchiveScan } from 'shared';
import { TYPES } from '../../../history-scan-coordinator/infrastructure/di/di-types';
import { ScanErrorType } from '../../../history-scan-coordinator/domain/scan/ScanError';
import { ScheduleScanJobs } from '../../../history-scan-coordinator/use-cases/schedule-scan-jobs/ScheduleScanJobs';

//Connects with the HistoryScanCoordinator module
@injectable()
export class HistoryScanCoordinatorScanService
	implements HistoryArchiveScanService
{
	//TODO: should not call repository directly, should call use case
	constructor(
		@inject(TYPES.HistoryArchiveScanRepository)
		private historyArchiveScanRepository: ScanRepository,
		private scheduleScansUseCase: ScheduleScanJobs
	) {}

	async scheduleScans(
		historyArchiveUrls: string[]
	): Promise<Result<void, Error>> {
		return this.scheduleScansUseCase.execute({
			historyArchiveUrls
		});
	}

	async findLatestScans(): Promise<Result<HistoryArchiveScan[], Error>> {
		try {
			const scans = await this.historyArchiveScanRepository.findLatest();
			const finishedScans = scans.filter((scan) => scan.endDate !== undefined);
			return ok(
				finishedScans.map(
					(scan) =>
						new HistoryArchiveScan(
							scan.baseUrl.value,
							scan.startDate as Date,
							scan.endDate as Date,
							scan.latestVerifiedLedger,
							scan.error?.type === ScanErrorType.TYPE_VERIFICATION,
							scan.error?.type === ScanErrorType.TYPE_VERIFICATION
								? scan.error.url
								: null,
							scan.error?.type === ScanErrorType.TYPE_VERIFICATION
								? scan.error.message
								: null,
							scan.isSlowArchive === true ? scan.isSlowArchive : false
						)
				)
			);
		} catch (e) {
			return err(mapUnknownToError(e));
		}
	}
}
