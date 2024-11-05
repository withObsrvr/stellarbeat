import { PublicKey, Statement } from '../../..';
import { ProtocolEvent } from '../../ProtocolEvent';
import { QuorumSet } from '../../QuorumSet';

export class VoteRatified extends ProtocolEvent {
	readonly subType = 'VoteRatified';
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
		}] vote(${this.statement.toString()}) ratified by quorum (${Array.from(
			this.quorum.keys()
		)}) in agreement attempt on statement ${this.statement.toString()}`;
	}
}
