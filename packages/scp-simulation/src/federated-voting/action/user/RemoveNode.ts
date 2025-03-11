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

	hash(): string {
		return this.subType + this.publicKey;
	}
}
