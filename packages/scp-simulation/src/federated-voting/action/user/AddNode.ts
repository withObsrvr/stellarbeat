import {
	Context,
	Node,
	ProtocolAction,
	QuorumSet,
	UserAction
} from '../../../core';

export class AddNode extends UserAction {
	subType = 'AddNode';
	immediateExecution = true;
	constructor(
		public readonly publicKey: string,
		public readonly quorumSet: QuorumSet
	) {
		super();
	}

	execute(context: Context): ProtocolAction[] {
		const node = new Node(this.publicKey, this.quorumSet);
		return context.addNode(node);
	}

	toString(): string {
		return `Add node ${this.publicKey}`;
	}

	hash(): string {
		return (
			this.subType +
			this.publicKey +
			this.quorumSet.threshold +
			this.quorumSet.validators.join('')
		);
	}
}
