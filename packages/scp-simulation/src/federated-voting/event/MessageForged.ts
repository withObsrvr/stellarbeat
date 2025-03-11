import { OverlayEvent } from '../../overlay';
import { Message } from '../Message';

export class MessageForged extends OverlayEvent {
	subType = 'MessageForged';

	constructor(public readonly message: Message) {
		super(message.sender);
	}

	toString(): string {
		return `${this.message.sender} forged message to ${this.message.receiver}: "${this.message}"`;
	}
}
