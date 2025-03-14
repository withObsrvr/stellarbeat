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

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			publicKey: this.publicKey,
			statement: this.statement
		};
	}

	static fromJSON(json: any): VoteOnStatement {
		return new VoteOnStatement(json.publicKey, json.statement);
	}
}
