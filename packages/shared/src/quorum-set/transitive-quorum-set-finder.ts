import {BaseQuorumSet} from "../quorum-set";

// finds the transitive quorum set for a given quorum set,
// meaning all the nodes reachable starting from the given quorum set
export class TransitiveQuorumSetFinder {
	static find(
		quorumSet: BaseQuorumSet,
		quorumSetMap: Map<string, BaseQuorumSet>
	) {
		return TransitiveQuorumSetFinder.findInternal(
			quorumSet,
			quorumSetMap,
			new Set<string>()
		);
	}

	private static findInternal(
		quorumSet: BaseQuorumSet,
		quorumSetMap: Map<string, BaseQuorumSet>,
		processedNodes: Set<string>
	) {
		quorumSet.validators.forEach((validator) => {
			if (!processedNodes.has(validator)) {
				processedNodes.add(validator);
				const quorumSet = quorumSetMap.get(validator);
				if (quorumSet) {
					this.findInternal(quorumSet, quorumSetMap, processedNodes);
				}
			}
		});

		quorumSet.innerQuorumSets.forEach((innerQuorumSet) => {
			this.findInternal(innerQuorumSet, quorumSetMap, processedNodes);
		});

		return processedNodes;
	}
}
