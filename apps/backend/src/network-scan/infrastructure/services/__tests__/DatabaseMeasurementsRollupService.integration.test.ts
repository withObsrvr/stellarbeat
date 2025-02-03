import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { MeasurementsRollupService } from '../../../domain/measurement-aggregation/MeasurementsRollupService';
import { NETWORK_TYPES } from '../../di/di-types';
import NetworkScan from '../../../domain/network/scan/NetworkScan';
import { NodeScan } from '../../../domain/node/scan/NodeScan';

describe('DatabaseMeasurementsRollupService.integration', () => {
	let kernel: Kernel;
	let rollupService: MeasurementsRollupService;

	beforeEach(async () => {
		kernel = await Kernel.getInstance(new ConfigMock());
		rollupService = kernel.container.get<MeasurementsRollupService>(
			NETWORK_TYPES.MeasurementsRollupService
		);
	});

	afterEach(async () => {
		await kernel.close();
	});

	it('should load the rollup service without errors', async () => {
		expect(rollupService).toBeDefined();
	});

	it('should roll up measurements with no data without throwing errors', async () => {
		const networkScan = new NetworkScan(new Date());
		await expect(
			rollupService.rollupNetworkMeasurements(networkScan)
		).resolves.not.toThrow();

		await expect(
			rollupService.rollupNodeMeasurements(networkScan)
		).resolves.not.toThrow();

		await expect(
			rollupService.rollupOrganizationMeasurements(networkScan)
		).resolves.not.toThrow();
	});
});
