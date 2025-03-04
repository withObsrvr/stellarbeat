import { Node, ProtocolAction, QuorumSet, UserAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class RemoveNode extends UserAction {
	subType = 'RemoveNode';
	immediateExecution = true;
	constructor(public readonly publicKey: string) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		context.removeNode(this.publicKey);

		return [];
	}

	toString(): string {
		return `Remove node ${this.publicKey}`;
	}
}
