import { Context, ProtocolAction, UserAction } from '../../../core';

export class RemoveNode extends UserAction {
	subType = 'RemoveNode';
	immediateExecution = true;
	constructor(public readonly publicKey: string) {
		super();
	}

	execute(context: Context): ProtocolAction[] {
		return context.removeNode(this.publicKey);
	}

	toString(): string {
		return `Remove node ${this.publicKey}`;
	}

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			publicKey: this.publicKey
		};
	}

	static fromJSON(json: any): RemoveNode {
		return new RemoveNode(json.publicKey);
	}
}
