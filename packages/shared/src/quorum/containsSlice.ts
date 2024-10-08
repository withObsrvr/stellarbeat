import { QuorumSet } from '../quorum-set';
import { PublicKey } from '../network';

export default function containsSlice(
	quorumSet: QuorumSet,
	nodes: Set<PublicKey>
) {
	//the number of nodes that need to be present in the quorumSet.
	let matchesNeeded = quorumSet.threshold;

	for (const validator of quorumSet.validators) {
		if (nodes.has(validator)) matchesNeeded--;
		if (matchesNeeded <= 0) return true;
	}

	for (const innerQuorumSet of quorumSet.innerQuorumSets) {
		if (containsSlice(innerQuorumSet, nodes)) {
			matchesNeeded--;
		}
		if (matchesNeeded <= 0) return true;
	}

	return false;
}
