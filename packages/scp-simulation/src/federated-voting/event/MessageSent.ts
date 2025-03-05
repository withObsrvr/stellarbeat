import { Message } from '../Message';
import { OverlayEvent } from '../../overlay/event/OverlayEvent';

export class MessageSent extends OverlayEvent {
	subType = 'MessageSent';

	constructor(public readonly message: Message) {
		super(message.sender);
	}

	toString(): string {
		return `${this.message.toString()}`;
	}
}
