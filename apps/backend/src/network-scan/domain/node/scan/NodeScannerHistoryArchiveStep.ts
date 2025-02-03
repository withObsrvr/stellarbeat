import { HistoryArchiveStatusFinder } from './HistoryArchiveStatusFinder';
import { inject, injectable } from 'inversify';
import { NodeScan } from './NodeScan';
import { HistoryArchiveScanService } from './history/HistoryArchiveScanService';
import { NETWORK_TYPES } from '../../../infrastructure/di/di-types';

@injectable()
export class NodeScannerHistoryArchiveStep {
	constructor(
		private historyArchiveStatusFinder: HistoryArchiveStatusFinder,
		@inject(NETWORK_TYPES.HistoryArchiveScanService)
		private historyArchiveScanService: HistoryArchiveScanService
	) {}

	public async execute(nodeScan: NodeScan): Promise<void> {
		nodeScan.updateHistoryArchiveUpToDateStatus(
			await this.historyArchiveStatusFinder.getNodesWithUpToDateHistoryArchives(
				nodeScan.getHistoryArchiveUrls(),
				nodeScan.latestLedger
			)
		);
		nodeScan.updateHistoryArchiveVerificationStatus(
			await this.historyArchiveStatusFinder.getNodesWithHistoryArchiveVerificationErrors(
				nodeScan.getHistoryArchiveUrls()
			)
		);

		this.historyArchiveScanService.scheduleScans(
			Array.from(nodeScan.getHistoryArchiveUrls().values())
		);
	}
}
