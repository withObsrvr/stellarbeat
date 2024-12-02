import { Message } from '../../Message';
import { ProtocolAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class ReceiveMessage extends ProtocolAction {
	subType = 'ReceiveMessage';
	readonly publicKey: string;

	constructor(public readonly message: Message) {
		super();
		this.publicKey = message.receiver;
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.receiveMessage(this.message);
	}

	toString(): string {
		return `${this.message.toString()}`;
	}
}
