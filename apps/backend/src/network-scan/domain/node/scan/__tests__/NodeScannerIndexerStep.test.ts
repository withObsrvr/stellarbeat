import { NodeScannerIndexerStep } from '../NodeScannerIndexerStep';
import { NodeScan } from '../NodeScan';
import { createDummyNode } from '../../__fixtures__/createDummyNode';
import { StellarCoreVersion } from '../../../network/StellarCoreVersion';
import { ITrustRankCalculator } from '../../../trust/TrustRankCalculator';
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
	const step = new NodeScannerIndexerStep(mockTrustRankCalculator);
	const stellarCoreVersion = StellarCoreVersion.create('13.0.0');
	if (stellarCoreVersion.isErr()) throw new Error('stellarCoreVersion is Err');
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update with indexer info', function () {
		const nodeScan = new NodeScan(new Date(), [createDummyNode()]);
		nodeScan.nodes[0].addMeasurement(
			new NodeMeasurement(new Date(), nodeScan.nodes[0])
		);
		step.execute(nodeScan, [], stellarCoreVersion.value);
		expect(nodeScan.nodes[0].latestMeasurement()?.index).toBeGreaterThan(0);
	});
});
