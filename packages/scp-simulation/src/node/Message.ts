import { PublicKey } from '..';
import { Vote } from '../federated-voting/Vote';

export class Message {
	constructor(
		public readonly sender: PublicKey,
		public readonly receiver: PublicKey,
		public readonly vote: Vote
	) {}

	toString(): string {
		return `From: ${this.sender.toString()}, To: ${this.receiver.toString()}, ${this.vote.toString()}`;
	}
}
