import { Node, PublicKey, QuorumSet } from '../../core';

export class QuorumService {
	/**
	 * Check if the given quorumCandidate is a quorum and that the publicKey with quorumSet is a member.
	 *
	 * A quorum is a set of nodes where every member has a slice in the quorum.
	 */
	public static isQuorumContainingNode(
		node: Node,
		quorumCandidate: Map<PublicKey, QuorumSet> //we assume we know all the QuorumSets
	): Map<PublicKey, QuorumSet> | null {
		const originalQuorumCandidateSize = quorumCandidate.size;

		if (originalQuorumCandidateSize === 0) {
			return null;
		}

		quorumCandidate = this.removeMembersWithoutSlice(quorumCandidate);

		if (originalQuorumCandidateSize === quorumCandidate.size) {
			// the original quorumCandidate has not been shrunk down and is a quorum
			if (
				this.hasSliceInSet(node.quorumSet, quorumCandidate) &&
				quorumCandidate.has(node.publicKey)
			) {
				//is the node with publicKey and quorumSet part of the quorumCandidate?
				return quorumCandidate;
			}
			return null;
		}

		// Check if the shrunk down quorumCandidate is a quorum
		return this.isQuorumContainingNode(node, quorumCandidate);
	}

	private static removeMembersWithoutSlice(
		quorumCandidate: Map<PublicKey, QuorumSet>
	): Map<PublicKey, QuorumSet> {
		const nodesThatContainSlice = new Map<PublicKey, QuorumSet>();
		for (const [publicKey, quorumSet] of quorumCandidate) {
			if (this.hasSliceInSet(quorumSet, quorumCandidate)) {
				nodesThatContainSlice.set(publicKey, quorumSet);
			}
		}
		return nodesThatContainSlice;
	}

	private static hasSliceInSet(
		quorumSet: QuorumSet,
		nodeSet: Map<PublicKey, QuorumSet>
	): boolean {
		let remainingThreshold = quorumSet.threshold;

		// Check if validators are part of the node set
		for (const validator of quorumSet.validators) {
			if (Array.from(nodeSet.keys()).includes(validator)) {
				remainingThreshold--;
				if (remainingThreshold === 0) return true;
			}
		}

		// Recursively check inner quorum sets
		for (const innerSet of quorumSet.innerQuorumSets) {
			if (this.hasSliceInSet(innerSet, nodeSet)) {
				remainingThreshold--;
				if (remainingThreshold === 0) return true;
			}
		}

		return false;
	}
}
