import { injectable, inject } from 'inversify';
import { StellarCoreVersion } from '../../network/StellarCoreVersion';
import { NodeMeasurementAverage } from '../NodeMeasurementAverage';
import { NodeScan } from './NodeScan';
import { NodeIndexer } from './NodeIndexer';
import { TrustRankCalculator, ITrustRankCalculator } from '../../trust/TrustRankCalculator';
import { TrustGraphFactory } from './TrustGraphFactory';
import { NodeTrustData } from '../../trust/TrustMetrics';
import Node from '../Node';
import { NodeOrganizationMappingService } from '../NodeOrganizationMappingService';
import { NETWORK_TYPES } from '../../../infrastructure/di/di-types';
import 'reflect-metadata';

@injectable()
export class NodeScannerIndexerStep {
	constructor(
		@inject(TrustRankCalculator) private trustRankCalculator: ITrustRankCalculator,
		@inject(NETWORK_TYPES.NodeOrganizationMappingService) private nodeOrganizationMappingService: NodeOrganizationMappingService
	) {}

	public async execute(
		nodeScan: NodeScan,
		measurement30DayAverages: NodeMeasurementAverage[],
		stellarCoreVersion: StellarCoreVersion
	): Promise<void> {
		// Calculate trust metrics for all nodes
		const trustGraph = TrustGraphFactory.create(nodeScan.nodes);
		const nodeData = await this.buildNodeTrustData(nodeScan.nodes);
		
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

	private async buildNodeTrustData(nodes: Node[]): Promise<Map<string, NodeTrustData>> {
		const nodeData = new Map<string, NodeTrustData>();
		const nodeOrganizationMap = await this.nodeOrganizationMappingService.mapNodesToOrganizations(nodes);
		
		nodes.forEach(node => {
			const latestMeasurement = node.latestMeasurement();
			const organizationId = nodeOrganizationMap.get(node.publicKey.value);
			
			nodeData.set(node.publicKey.value, {
				organizationId: organizationId?.value || null,
				isValidator: latestMeasurement?.isValidating || false
			});
		});

		return nodeData;
	}
}
