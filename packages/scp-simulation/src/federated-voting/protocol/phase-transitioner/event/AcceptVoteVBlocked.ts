import { PublicKey } from '../../../../core';
import { ProtocolEvent } from '../../event/ProtocolEvent';
import { Statement } from '../../Statement';

export class AcceptVoteVBlocked extends ProtocolEvent {
	readonly subType = 'AcceptVoteVBlocked';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly vBlockingSet: Set<PublicKey>
	) {
		super(publicKey);
	}

	toString(): string {
		return `Accept(${this.statement}) votes from ${Array.from(this.vBlockingSet)} are v-blocking`;
	}
}
