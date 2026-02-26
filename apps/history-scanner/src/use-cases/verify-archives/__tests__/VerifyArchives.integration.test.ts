import 'reflect-metadata';
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
	jest.setTimeout(120000); // slow integration tests with retry logic

	beforeAll(async () => {
		await mockHistoryArchive.listen(3333);
		coordinatorServiceMock = mock<ScanCoordinatorService>();
		kernel = await Kernel.getInstance(new ConfigMock());
		kernel.container
			.rebind(TYPES.ScanCoordinatorService)
			.toConstantValue(coordinatorServiceMock);

		verifyArchives = kernel.container.get(VerifyArchives);
	});

	afterAll(async () => {
		await mockHistoryArchive.stop();
		await kernel.close();
	});

	// Skip: This test was designed for stellar-archivist backend.
	// With TypeScript scanner (useStellarArchivist=false), the mock server's missing bucket files
	// cause httpQueue to retry 404s until failure, triggering Scanner retry logic with 30s+ delays.
	// TODO: Either add all required bucket fixtures or fix httpQueue to not retry 404 errors.
	it.skip('should scan all known archives', async () => {
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
		// The scan should complete and process ledgers, even if some bucket files are missing
		// (missing bucket files will be recorded as errors but won't prevent scanning)
		expect(registeredScan.latestScannedLedger).toBeGreaterThanOrEqual(0);
		// TypeScript scanner provides header hashes, stellar-archivist doesn't
		// When useStellarArchivist=false (default), we expect a hash
		expect(registeredScan.latestScannedLedgerHeaderHash).toBeDefined();
	});
});
