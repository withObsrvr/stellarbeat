import { injectable, inject } from 'inversify';
import { StellarCoreVersion } from '../../network/StellarCoreVersion';
import { NodeMeasurementAverage } from '../NodeMeasurementAverage';
import { NodeScan } from './NodeScan';
import { NodeIndexer } from './NodeIndexer';
import { TrustRankCalculator, ITrustRankCalculator } from '../../trust/TrustRankCalculator';
import { TrustGraphFactory } from './TrustGraphFactory';
import { NodeTrustData } from '../../trust/TrustMetrics';
import 'reflect-metadata';

@injectable()
export class NodeScannerIndexerStep {
	constructor(
		@inject(TrustRankCalculator) private trustRankCalculator: ITrustRankCalculator
	) {}

	public execute(
		nodeScan: NodeScan,
		measurement30DayAverages: NodeMeasurementAverage[],
		stellarCoreVersion: StellarCoreVersion
	): void {
		// Calculate trust metrics for all nodes
		const trustGraph = TrustGraphFactory.create(nodeScan.nodes);
		const nodeData = this.buildNodeTrustData(nodeScan.nodes);
		
		const trustResult = this.trustRankCalculator.calculateTrustMetrics(
			trustGraph,
			nodeData
		);

		// Update nodes with trust metrics
		nodeScan.nodes.forEach(node => {
			const trustMetrics = trustResult.trustMetrics.get(node.publicKey.value);
			if (trustMetrics) {
				const latestMeasurement = node.latestMeasurement();
				if (latestMeasurement) {
					latestMeasurement.trustCentralityScore = trustMetrics.trustCentralityScore;
					latestMeasurement.pageRankScore = trustMetrics.pageRankScore;
					latestMeasurement.trustRank = trustMetrics.trustRank;
					latestMeasurement.lastTrustCalculation = trustMetrics.lastTrustCalculation;
				}
			}
		});

		// Calculate indexes using existing logic
		nodeScan.updateIndexes(
			NodeIndexer.calculateIndexes(
				nodeScan.nodes,
				measurement30DayAverages,
				stellarCoreVersion
			)
		);
	}

	private buildNodeTrustData(nodes: any[]): Map<string, NodeTrustData> {
		const nodeData = new Map<string, NodeTrustData>();
		
		nodes.forEach(node => {
			const organizationId = node.organizationId ? node.organizationId.value : null;
			const latestMeasurement = node.latestMeasurement();
			
			nodeData.set(node.publicKey.value, {
				organizationId,
				isValidator: latestMeasurement?.isValidating || false
			});
		});

		return nodeData;
	}
}
