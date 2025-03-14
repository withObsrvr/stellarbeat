import { UserAction, ProtocolAction, QuorumSet, Context } from '../../../core';

export class UpdateQuorumSet extends UserAction {
	subType = 'UpdateQuorumSet';
	immediateExecution = true;
	constructor(
		public readonly publicKey: string,
		public readonly quorumSet: QuorumSet
	) {
		super();
	}

	execute(context: Context): ProtocolAction[] {
		return context.updateQuorumSet(this.publicKey, this.quorumSet);
	}

	toString(): string {
		return `${this.publicKey}:update quorumSet(${this.quorumSet.toString()})`;
	}

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			publicKey: this.publicKey,
			quorumSet: this.quorumSet.toJSON()
		};
	}

	static fromJSON(json: any): UpdateQuorumSet {
		return new UpdateQuorumSet(
			json.publicKey,
			QuorumSet.fromJSON(json.quorumSet)
		);
	}
}
