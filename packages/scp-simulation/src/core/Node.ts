import { QuorumSet } from './QuorumSet';

export class Node {
	private _quorumSet: QuorumSet;

	constructor(
		public readonly publicKey: string,
		quorumSet: QuorumSet
	) {
		this._quorumSet = quorumSet;
	}

	updateQuorumSet(quorumSet: QuorumSet) {
		this._quorumSet = quorumSet;
	}

	get quorumSet(): QuorumSet {
		return this._quorumSet;
	}

	toJSON(): Record<string, unknown> {
		return {
			publicKey: this.publicKey,
			quorumSet: this._quorumSet.toJSON()
		};
	}

	fromJSON(json: Record<string, unknown>): Node {
		return new Node(
			json.publicKey as string,
			this._quorumSet.fromJSON(json.quorumSet as Record<string, unknown>)
		);
	}
}
