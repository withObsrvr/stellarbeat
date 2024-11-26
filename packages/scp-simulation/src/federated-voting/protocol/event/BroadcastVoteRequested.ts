import { PublicKey } from '../../../core';
import { ProtocolEvent } from '../ProtocolEvent';
import { Vote } from '../Vote';

export class BroadcastVoteRequested extends ProtocolEvent {
	readonly subType = 'BroadCastVoteRequested';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly vote: Vote
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey.toString()}][${
			this.subType
		}] vote: ${this.vote.toString()}`;
	}
}
