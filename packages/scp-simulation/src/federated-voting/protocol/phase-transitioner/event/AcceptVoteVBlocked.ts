import { PublicKey } from '../../../../core';
import { ProtocolEvent } from '../../ProtocolEvent';
import { Statement } from '../../Statement';

export class AcceptVoteVBlocked extends ProtocolEvent {
	readonly subType = 'AcceptVoteVBlocked';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly vBlockingSet: Set<PublicKey>
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${this.subType}] Accept(${this.statement}) votes from ${this.vBlockingSet} are v-blocking`;
	}
}
