import { Message } from '../../simulation/Message';
import { OverlayEvent } from './OverlayEvent';

export class MessageReceived extends OverlayEvent {
	subType = 'MessageReceived';

	constructor(public readonly message: Message) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.message.toString()}`;
	}
}
