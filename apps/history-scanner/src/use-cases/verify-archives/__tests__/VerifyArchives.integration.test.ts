import { MockHistoryArchive } from '../../../infrastructure/http/MockHistoryArchive';
import { VerifyArchives } from '../VerifyArchives';
import Kernel from '../../../infrastructure/Kernel';
import { ConfigMock } from '../../../infrastructure/config/__mocks__/configMock';
import { ScanCoordinatorService } from '../../../domain/scan/ScanCoordinatorService';
import { mock } from 'jest-mock-extended';
import { TYPES } from '../../../infrastructure/di/di-types';
import { ok } from 'neverthrow';

let kernel: Kernel;
const mockHistoryArchive: MockHistoryArchive = new MockHistoryArchive();
const coordinatorServiceMock = mock<ScanCoordinatorService>();

let verifyArchives: VerifyArchives;
jest.setTimeout(60000); //slow integration tests
beforeAll(async () => {
	kernel = await Kernel.getInstance(new ConfigMock());
	kernel.container
		.rebind(TYPES.ScanCoordinatorService)
		.toConstantValue(coordinatorServiceMock);
	await mockHistoryArchive.listen(3333); //make sure this is a unique port not requiring superuser rights (linux > 1024)
	verifyArchives = kernel.container.get(VerifyArchives);
});

afterAll(async () => {
	await mockHistoryArchive.stop();
	await kernel.close();
});

it('should scan all known archives', async function () {
	coordinatorServiceMock.getPendingScanJobs.mockResolvedValue(ok([]));
	coordinatorServiceMock.saveScanResult.mockResolvedValue(ok(undefined));
	await verifyArchives.execute({
		persist: true,
		loop: false
	});
});
