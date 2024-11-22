import { Message } from '../../simulation/Message';
import { Event } from '../../core/Event';

export class MessageQueued implements Event {
	readonly type = 'MessageQueued';
	constructor(public readonly message: Message) {}

	toString(): string {
		return `[${this.message.sender}][${this.type}] Message queued: ${this.message.toString()}`;
	}
}
