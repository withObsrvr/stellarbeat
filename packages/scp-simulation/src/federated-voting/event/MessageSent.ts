import { Message } from '../Message';
import { OverlayEvent } from './OverlayEvent';

export class MessageSent extends OverlayEvent {
	subType = 'MessageSent';

	constructor(
		public readonly publicKey: string,
		public readonly message: Message
	) {
		super(publicKey);
	}

	toString(): string {
		return `[${this.subType}] ${this.message.toString()}`;
	}
}
