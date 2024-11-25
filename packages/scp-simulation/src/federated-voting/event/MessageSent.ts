import { Message } from '../../simulation/Message';
import { OverlayEvent } from './OverlayEvent';

export class MessageSent extends OverlayEvent {
	subType = 'MessageSent';

	constructor(public readonly message: Message) {
		super();
	}

	toString(): string {
		return `[${this.subType}] ${this.message.toString()}`;
	}
}
