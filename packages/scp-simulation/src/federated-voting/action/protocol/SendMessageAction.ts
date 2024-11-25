import { Message } from '../../../simulation/Message';
import { ProtocolAction } from '../../../core/ProtocolAction';
import { Context } from 'vm';
import { FederatedVotingContext } from '../../FederatedVotingContext';

export class SendMessageProtocolAction extends ProtocolAction {
	constructor(public readonly message: Message) {
		super();
	}

	execute(context: FederatedVotingContext): ProtocolAction[] {
		return context.sendMessage(this.message);
	}

	toString(): string {
		return `[SendMessageAction] ${this.message.toString()}`;
	}
}
