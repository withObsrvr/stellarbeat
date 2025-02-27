import { UserAction, ProtocolAction } from '../../../core';
import { Statement } from '../../../federated-voting/protocol';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class VoteOnStatement extends UserAction {
	subType = 'VoteOnStatement';
	immediateExecution = false;

	constructor(
		public readonly publicKey: string,
		public readonly statement: Statement
	) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.vote(this.publicKey, this.statement);
	}

	toString(): string {
		return `${this.publicKey}:vote(${this.statement.toString()})`;
	}
}
