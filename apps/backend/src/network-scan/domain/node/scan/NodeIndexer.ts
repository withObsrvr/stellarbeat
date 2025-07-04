import { NodeMeasurementAverage } from '../NodeMeasurementAverage';
import { StellarCoreVersion } from '../../network/StellarCoreVersion';
import { NodeIndex } from './node-index/node-index';
import { TrustGraphFactory } from './TrustGraphFactory';
import Node from '../Node';

export class NodeIndexer {
	public static calculateIndexes(
		nodes: Node[],
		measurement30DayAverages: NodeMeasurementAverage[],
		currentStellarCoreVersion: StellarCoreVersion
	) {
		return NodeIndex.calculateIndexes(
			nodes.map((node) => {
				const latestMeasurement = node.latestMeasurement();
				return {
					publicKey: node.publicKey.value,
					stellarCoreVersion: node.versionStr ?? 'unknown',
					dateDiscovered: node.dateDiscovered,
					validating30DaysPercentage:
						measurement30DayAverages.find(
							(measurement) => measurement.publicKey === node.publicKey.value
						)?.validatingAvg ?? 0,
					isActive30DaysPercentage:
						measurement30DayAverages.find(
							(measurement) => measurement.publicKey === node.publicKey.value
						)?.activeAvg ?? 0,
					isValidating: latestMeasurement?.isValidating ?? false,
					hasUpToDateHistoryArchive:
						latestMeasurement?.isFullValidator ?? false,
					trustCentralityScore: latestMeasurement?.trustCentralityScore
				};
			}),
			TrustGraphFactory.create(nodes),
			currentStellarCoreVersion.value
		);
	}
}
