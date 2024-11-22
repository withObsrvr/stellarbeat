import { Message } from '../../../simulation/Message';
import { FederatedVotingContext } from '../../FederatedVotingContext';
import { ProtocolAction } from '../../../core/ProtocolAction';

export class SendMessageProtocolAction extends ProtocolAction {
	constructor(public readonly message: Message) {
		super();
	}

	toString(): string {
		return `[SendMessageAction] ${this.message.toString()}`;
	}
}
