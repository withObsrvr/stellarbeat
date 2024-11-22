import { PublicKey } from '..';
import { QuorumSet } from '../core/QuorumSet';

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
}
