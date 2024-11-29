import { PublicKey } from '../../../core';
import { ProtocolEvent } from './ProtocolEvent';
import { Vote } from '../Vote';

export class BroadcastVoteRequested extends ProtocolEvent {
	readonly subType = 'BroadCastVoteRequested';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly vote: Vote
	) {
		super(publicKey);
	}

	toString(): string {
		return `${this.vote.toString()}`;
	}
}
