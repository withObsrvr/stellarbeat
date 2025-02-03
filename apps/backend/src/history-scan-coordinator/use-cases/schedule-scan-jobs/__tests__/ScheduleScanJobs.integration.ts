import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { ScheduleScanJobs } from '../ScheduleScanJobs';

let kernel: Kernel;
jest.setTimeout(60000); // adjust if needed

beforeAll(async () => {
	kernel = await Kernel.getInstance(new ConfigMock());
});

afterAll(async () => {
	await kernel.close();
});

test('ScheduleScanJobs integration test', async () => {
	const scheduleScanJobs = kernel.container.get(ScheduleScanJobs);
	expect(scheduleScanJobs).toBeDefined();

	const result = await scheduleScanJobs.execute({
		historyArchiveUrls: ['https://example.com']
	});
	expect(result.isOk()).toBe(true);
});
