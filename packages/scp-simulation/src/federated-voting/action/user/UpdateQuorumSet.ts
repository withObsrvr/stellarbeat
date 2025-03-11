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

	hash(): string {
		return this.subType + this.publicKey + this.quorumSet.toJSON();
	}
}
