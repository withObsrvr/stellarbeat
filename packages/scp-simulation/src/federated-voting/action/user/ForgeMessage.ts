import { ProtocolAction, UserAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';
import { Message } from '../../Message';

export class ForgeMessage extends UserAction {
	subType = 'ForgeMessage';
	immediateExecution = false;
	readonly publicKey: string;
	constructor(public readonly message: Message) {
		super();
		this.publicKey = message.sender;
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.forgeMessage(this.message);
	}

	toString(): string {
		return `Forge message from ${this.publicKey} to ${this.message.receiver}: "${this.message.vote}"`;
	}

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			message: this.message.toJSON()
		};
	}

	static fromJSON(json: any): ForgeMessage {
		return new ForgeMessage(Message.fromJSON(json.message));
	}
}
