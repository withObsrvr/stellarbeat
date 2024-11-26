import { Node, ProtocolAction, QuorumSet, UserAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';
import { FederatedVotingProtocolState } from '../../protocol';

export class AddNode extends UserAction {
	constructor(
		public readonly publicKey: string,
		public readonly quorumSet: QuorumSet
	) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		const node = new Node(this.publicKey, this.quorumSet);
		context.addNode(node);

		return [];
	}

	toString(): string {
		return `Add node ${this.publicKey}`;
	}
}
