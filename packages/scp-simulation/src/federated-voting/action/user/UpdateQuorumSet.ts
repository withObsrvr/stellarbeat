import { UserAction, ProtocolAction, QuorumSet } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class UpdateQuorumSet extends UserAction {
	subType = 'UpdateQuorumSet';
	immediateExecution = true;
	constructor(
		public readonly publicKey: string,
		public readonly quorumSet: QuorumSet
	) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.updateQuorumSet(this.publicKey, this.quorumSet);
	}

	toString(): string {
		return `${this.publicKey}:update quorumSet(${this.quorumSet.toString()})`;
	}
}
