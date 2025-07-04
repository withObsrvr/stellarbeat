import { NodeScannerIndexerStep } from '../NodeScannerIndexerStep';
import { NodeScan } from '../NodeScan';
import { createDummyNode } from '../../__fixtures__/createDummyNode';
import { StellarCoreVersion } from '../../../network/StellarCoreVersion';
import { ITrustRankCalculator } from '../../../trust/TrustRankCalculator';
import { NodeOrganizationMappingService } from '../../NodeOrganizationMappingService';
import 'reflect-metadata';
import NodeMeasurement from '../../NodeMeasurement';

describe('NodeScannerIndexerStep', () => {
	const mockTrustRankCalculator: ITrustRankCalculator = {
		calculateTrustMetrics: jest.fn().mockReturnValue({
			trustMetrics: new Map(),
			convergenceAchieved: true,
			iterationsUsed: 1,
			calculationTimestamp: new Date()
		})
	};
	const mockNodeOrganizationMappingService = {
		mapNodesToOrganizations: jest.fn().mockResolvedValue(new Map())
	} as jest.Mocked<NodeOrganizationMappingService>;
	const step = new NodeScannerIndexerStep(mockTrustRankCalculator, mockNodeOrganizationMappingService);
	const stellarCoreVersion = StellarCoreVersion.create('13.0.0');
	if (stellarCoreVersion.isErr()) throw new Error('stellarCoreVersion is Err');
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update with indexer info', async function () {
		const nodeScan = new NodeScan(new Date(), [createDummyNode()]);
		nodeScan.nodes[0].addMeasurement(
			new NodeMeasurement(new Date(), nodeScan.nodes[0])
		);
		await step.execute(nodeScan, [], stellarCoreVersion.value);
		expect(nodeScan.nodes[0].latestMeasurement()?.index).toBeGreaterThan(0);
	});
});
