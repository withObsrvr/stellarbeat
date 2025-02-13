import { VerifyArchives } from '../VerifyArchives';
import Kernel from '../../../infrastructure/Kernel';
import { ConfigMock } from '../../../infrastructure/config/__mocks__/configMock';
import { mock } from 'jest-mock-extended';
import { ScanCoordinatorService } from '../../../domain/scan/ScanCoordinatorService';
import { ok } from 'neverthrow';
import { TYPES } from '../../../infrastructure/di/di-types';
import { MockHistoryArchive } from '../../../infrastructure/http/MockHistoryArchive';

describe('VerifyArchives Integration Tests', () => {
	let kernel: Kernel;
	let verifyArchives: VerifyArchives;
	let coordinatorServiceMock: jest.Mocked<ScanCoordinatorService>;
	const mockHistoryArchive: MockHistoryArchive = new MockHistoryArchive();
	jest.setTimeout(60000); // slow integration tests

	beforeAll(async () => {
		mockHistoryArchive.listen(3333);
		coordinatorServiceMock = mock<ScanCoordinatorService>();
		kernel = await Kernel.getInstance(new ConfigMock());
		kernel.container
			.rebind(TYPES.ScanCoordinatorService)
			.toConstantValue(coordinatorServiceMock);

		verifyArchives = kernel.container.get(VerifyArchives);
	});

	afterAll(async () => {
		mockHistoryArchive.stop();
		await kernel.close();
	});

	it('should scan all known archives', async () => {
		// Setup mock scan jobs
		const mockScanJob = {
			url: 'http://127.0.0.1:3333',
			latestScannedLedger: 0,
			latestScannedLedgerHeaderHash: null,
			chainInitDate: new Date(),
			remoteId: 'test'
		};

		coordinatorServiceMock.getScanJob.mockResolvedValue(ok(mockScanJob));
		coordinatorServiceMock.registerScan.mockResolvedValue(ok(undefined));

		await verifyArchives.execute({
			persist: true,
			loop: false
		});

		expect(coordinatorServiceMock.getScanJob).toHaveBeenCalled();
		expect(coordinatorServiceMock.registerScan).toHaveBeenCalled();

		const registeredScan = coordinatorServiceMock.registerScan.mock.calls[0][0];
		expect(registeredScan).toBeDefined();
		expect(registeredScan.hasError()).toBe(false);
		expect(registeredScan.latestScannedLedger).toEqual(127);
		expect(registeredScan.latestScannedLedgerHeaderHash).toEqual(
			'7XqhM1busGfKYJi/v/lHL/IDp/h/6TMLTDxYwKu88QA='
		);
	});
});
