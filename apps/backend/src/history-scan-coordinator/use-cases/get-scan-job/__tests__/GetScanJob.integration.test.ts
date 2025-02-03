import { GetScanJob } from '../GetScanJob';
import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';

let kernel: Kernel;

describe('GetScanJob Integration', () => {
	jest.setTimeout(60000); // Adjust if needed for slow startup

	beforeEach(async () => {
		kernel = await Kernel.getInstance(new ConfigMock());
	});

	afterEach(async () => {
		await kernel.close();
	});

	it('should execute GetScanJob', async () => {
		const getScanJob = kernel.container.get(GetScanJob);
		expect(getScanJob).toBeDefined();

		const result = await getScanJob.execute();
		expect(result.isOk()).toBe(true);
		expect(result._unsafeUnwrap()).toBeNull();
	});
});
