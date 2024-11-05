import { Event } from '../../core/Event';
import { Message } from '../Message';

export class MessageSent implements Event {
	type = 'MessageSent';
	constructor(public readonly message: Message) {}
	toString(): string {
		return `[${this.type}] ${this.message.toString()}`;
	}
}
