import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { ScheduleScanJobs } from '../ScheduleScanJobs';

let kernel: Kernel;
jest.setTimeout(60000); // adjust if needed

beforeAll(async () => {
	try {
		console.log('Initializing kernel...');
		kernel = await Kernel.getInstance(new ConfigMock());
		console.log('Kernel initialized successfully');
	} catch (error) {
		console.error('Failed to initialize kernel:', error);
		throw error;
	}
});

afterAll(async () => {
	if (kernel) {
		try {
			console.log('Closing kernel...');
			await kernel.close();
			console.log('Kernel closed successfully');
		} catch (error) {
			console.error('Failed to close kernel:', error);
			throw error;
		}
	} else {
		console.warn('Kernel was not initialized, skipping close');
	}
});

test('ScheduleScanJobs integration test', async () => {
	const scheduleScanJobs = kernel.container.get(ScheduleScanJobs);
	expect(scheduleScanJobs).toBeDefined();

	const result = await scheduleScanJobs.execute({
		historyArchiveUrls: ['https://example.com']
	});
	expect(result.isOk()).toBe(true);
});
