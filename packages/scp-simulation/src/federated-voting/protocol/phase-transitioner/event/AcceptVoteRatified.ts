import { PublicKey, QuorumSet } from '../../../../core';
import { ProtocolEvent } from '../../ProtocolEvent';
import { Statement } from '../../Statement';

export class AcceptVoteRatified extends ProtocolEvent {
	readonly subType = 'AcceptVoteRatified';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly quorum: Map<string, QuorumSet>
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${
			this.subType
		}] vote(accept(${this.statement.toString()})) ratified by quorum (${Array.from(
			this.quorum.keys()
		)}) in agreement attempt on statement ${this.statement.toString()}`;
	}
}
