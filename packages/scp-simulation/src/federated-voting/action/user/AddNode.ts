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

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			publicKey: this.publicKey,
			quorumSet: this.quorumSet.toJSON()
		};
	}

	static fromJSON(json: any): AddNode {
		return new AddNode(json.publicKey, QuorumSet.fromJSON(json.quorumSet));
	}
}
