import { Message } from '../Message';
import { OverlayEvent } from '../../overlay/event/OverlayEvent';

export class MessageReceived extends OverlayEvent {
	subType = 'MessageReceived';

	constructor(public readonly message: Message) {
		super(message.receiver);
	}

	toString(): string {
		return `${this.message.toString()}`;
	}
}
