import { PublicKey } from '..';
import { Vote } from './protocol/Vote';

export class Message {
	constructor(
		public readonly sender: PublicKey,
		public readonly receiver: PublicKey,
		public readonly vote: Vote // in the future this should be an abstract payload with a hash function
	) {}

	toString(): string {
		return `From: ${this.sender.toString()}, To: ${this.receiver.toString()}, ${this.vote.toString()}`;
	}
}
