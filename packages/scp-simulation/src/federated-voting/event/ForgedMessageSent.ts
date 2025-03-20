import { Message } from '../Message';
import { OverlayEvent } from '../../overlay/event/OverlayEvent';

export class ForgedMessageSent extends OverlayEvent {
	subType = 'ForgedMessageSent';

	constructor(public readonly message: Message) {
		super(message.sender);
	}

	toString(): string {
		return `${this.message.sender.toString()} sent forged message to: ${this.message.receiver.toString()}: ${this.message.vote.toString()}`;
	}
}
