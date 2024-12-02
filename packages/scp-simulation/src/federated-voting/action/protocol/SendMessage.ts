import { Message } from '../../Message';
import { ProtocolAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class SendMessage extends ProtocolAction {
	subType = 'SendMessage';
	public readonly publicKey: string;
	constructor(public readonly message: Message) {
		super();
		this.publicKey = message.sender;
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.sendMessage(this.message);
	}

	toString(): string {
		return `${this.message.toString()}`;
	}
}
