import { PublicKey, QuorumSet } from '../../core';

export class QuorumSetService {
	static isSetVBlocking(nodeSet: PublicKey[], quorumSet: QuorumSet): boolean {
		return this.isSetVBlockingInternal(nodeSet, quorumSet);
	}

	private static isSetVBlockingInternal(
		nodeSet: PublicKey[],
		quorumSet: QuorumSet
	): boolean {
		if (quorumSet.threshold === 0) {
			return false; // Cannot overlap empty slices
		}

		let leftUntilBlocked = this.getMinimumBlockingSetSize(quorumSet);

		for (const validator of quorumSet.validators) {
			if (nodeSet.includes(validator)) {
				leftUntilBlocked--;
				if (leftUntilBlocked === 0) {
					return true;
				}
			}
		}

		for (const innerQSet of quorumSet.innerQuorumSets) {
			if (this.isSetVBlockingInternal(nodeSet, innerQSet)) {
				leftUntilBlocked--;
				if (leftUntilBlocked === 0) {
					return true;
				}
			}
		}

		return false; // We can still reach the threshold
	}

	private static getMinimumBlockingSetSize(quorumSet: QuorumSet): number {
		return (
			quorumSet.validators.length +
			quorumSet.innerQuorumSets.length -
			quorumSet.threshold +
			1
		);
	}

	public static calculatePotentiallyBlockedNodes(
		quorumSets: Map<PublicKey, QuorumSet>,
		illBehavedNodes: Array<PublicKey>
	) {
		const blockedNodes = new Set<PublicKey>();
		let recalculateBlockedNodes = true;

		while (recalculateBlockedNodes) {
			recalculateBlockedNodes = false;
			quorumSets.forEach((quorumSet, publicKey) => {
				if (illBehavedNodes.includes(publicKey)) {
					return;
				}
				if (blockedNodes.has(publicKey)) {
					return;
				}
				if (
					this.quorumSetCanReachThreshold(
						quorumSet,
						Array.from(blockedNodes).concat(illBehavedNodes)
					)
				) {
					return;
				}

				blockedNodes.add(publicKey);
				recalculateBlockedNodes = true;
			});
		}
		return blockedNodes;
	}

	public static quorumSetCanReachThreshold(
		quorumSet: QuorumSet,
		livenessBefouledNodes: PublicKey[]
	) {
		let counter = quorumSet.validators.filter(
			(validator) => !livenessBefouledNodes.includes(validator)
		).length;

		quorumSet.innerQuorumSets.forEach((innerQS) => {
			if (this.quorumSetCanReachThreshold(innerQS, livenessBefouledNodes)) {
				counter++;
			}
		});

		return counter >= quorumSet.threshold;
	}
}
