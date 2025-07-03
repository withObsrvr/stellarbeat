import { ValidatingIndex } from './index/validating-index';
import { TypeIndex } from './index/type-index';
import { ActiveIndex } from './index/active-index';
import { VersionIndex } from './index/version-index';
import { AgeIndex } from './index/age-index';
import { TrustIndex } from './index/trust-index';
import { TrustGraph } from 'shared';

export interface IndexNode {
	publicKey: string;
	isActive30DaysPercentage: number;
	hasUpToDateHistoryArchive: boolean;
	isValidating: boolean;
	stellarCoreVersion: string;
	dateDiscovered: Date;
	validating30DaysPercentage: number;
	trustCentralityScore?: number;
}

export class NodeIndex {
	static calculateIndexes(
		nodes: IndexNode[],
		trustGraph: TrustGraph,
		currentStellarCoreVersion: string
	): Map<string, number> {
		//index two digits after comma
		const result = new Map<string, number>();
		nodes.forEach((node) => {
			// Use pre-calculated trust score if available, otherwise fall back to old calculation
			const trustScore = node.trustCentralityScore !== undefined 
				? node.trustCentralityScore / 100  // Convert 0-100 scale to 0-1 scale
				: TrustIndex.get(node.publicKey, trustGraph);

			const indexRaw =
				(TypeIndex.get(node.hasUpToDateHistoryArchive, node.isValidating) +
					ActiveIndex.get(node.isActive30DaysPercentage) +
					ValidatingIndex.get(node.validating30DaysPercentage) +
					VersionIndex.get(node.stellarCoreVersion, currentStellarCoreVersion) +
					trustScore +
					AgeIndex.get(node.dateDiscovered)) /
				6;

			const indexToFixed = Number(indexRaw.toFixed(2));
			const index = Math.floor(indexToFixed * 100);
			//floating point precision issues e.g 0.28 * 100 = 28.000000000000004
			result.set(node.publicKey, index);
		});
		return result;
	}
}
