import { Context, ProtocolAction, UserAction } from '../../core';
import { PublicKey } from '../Overlay';

export class AddConnection extends UserAction {
	readonly subType = 'AddConnection';
	readonly immediateExecution = true;
	readonly publicKey: PublicKey;

	constructor(
		public readonly a: PublicKey,
		public readonly b: PublicKey
	) {
		super();
		this.publicKey = a; //where in the gui do we want to see the action registered?
	}

	execute(context: Context): ProtocolAction[] {
		return context.addConnection(this.a, this.b);
	}

	toString(): string {
		return `Add connection between ${this.a} and ${this.b}`;
	}

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			a: this.a,
			b: this.b
		};
	}

	static fromJSON(json: any): AddConnection {
		return new AddConnection(json.a, json.b);
	}
}
