import { PublicKey } from '../../../../core';
import { QuorumSet } from '../../../../core/QuorumSet';
import { ProtocolEvent } from '../../event/ProtocolEvent';
import { Statement } from '../../Statement';

export class VoteRatified extends ProtocolEvent {
	readonly subType = 'VoteRatified';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly quorum: Map<string, QuorumSet>
	) {
		super(publicKey);
	}

	toString(): string {
		return `vote(${this.statement.toString()}) ratified by quorum (${Array.from(
			this.quorum.keys()
		)})`;
	}
}
