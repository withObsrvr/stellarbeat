import { Message } from '../../Message';
import { ProtocolAction } from '../../../core';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class ReceiveMessage extends ProtocolAction {
	constructor(public readonly message: Message) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.receiveMessage(this.message);
	}

	toString(): string {
		return `[ReceiveMessage] ${this.message.toString()}`;
	}
}
