import { PublicKey, Statement } from '../../..';
import { QuorumSet } from '../../../core/QuorumSet';
import { ProtocolEvent } from '../../ProtocolEvent';

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
		)}) for statement ${this.statement.toString()}`;
	}
}
