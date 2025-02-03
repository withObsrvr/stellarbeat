import { NodeScannerHistoryArchiveStep } from '../NodeScannerHistoryArchiveStep';
import { mock } from 'jest-mock-extended';
import { HistoryArchiveStatusFinder } from '../HistoryArchiveStatusFinder';
import { NodeScan } from '../NodeScan';
import { HistoryArchiveScanService } from '../history/HistoryArchiveScanService';

describe('NodeScannerHistoryArchiveStep', () => {
	const historyArchiveStatusFinder = mock<HistoryArchiveStatusFinder>();
	const historyArchiveScanService = mock<HistoryArchiveScanService>();
	const historyArchiveStep = new NodeScannerHistoryArchiveStep(
		historyArchiveStatusFinder,
		historyArchiveScanService
	);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update full validator status', async () => {
		const nodeScan = mock<NodeScan>();
		nodeScan.getHistoryArchiveUrls.mockReturnValue(new Map([['a', 'url']]));
		const upToDateArchives = new Set(['a']);
		historyArchiveStatusFinder.getNodesWithUpToDateHistoryArchives.mockResolvedValue(
			upToDateArchives
		);
		const verificationErrors = new Set(['b']);
		historyArchiveStatusFinder.getNodesWithHistoryArchiveVerificationErrors.mockResolvedValue(
			verificationErrors
		);
		await historyArchiveStep.execute(nodeScan);
		expect(
			historyArchiveStatusFinder.getNodesWithUpToDateHistoryArchives
		).toBeCalled();
		expect(
			historyArchiveStatusFinder.getNodesWithHistoryArchiveVerificationErrors
		).toBeCalled();
		expect(nodeScan.updateHistoryArchiveUpToDateStatus).toBeCalledWith(
			upToDateArchives
		);
		expect(nodeScan.updateHistoryArchiveVerificationStatus).toBeCalledWith(
			verificationErrors
		);
	});

	it('should schedule new archive scans', async () => {
		const nodeScan = mock<NodeScan>();
		const urls = new Map<string, string>([['a', 'url']]);
		nodeScan.getHistoryArchiveUrls.mockReturnValue(urls);
		await historyArchiveStep.execute(nodeScan);
		expect(historyArchiveScanService.scheduleScans).toBeCalledWith(
			Array.from(urls.values())
		);
	});
});
