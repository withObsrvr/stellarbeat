import { PublicKey, QuorumSet } from '../../../../core';
import { ProtocolEvent } from '../../event/ProtocolEvent';
import { Statement } from '../../Statement';

export class AcceptVoteRatified extends ProtocolEvent {
	readonly subType = 'AcceptVoteRatified';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement,
		public readonly quorum: Map<string, QuorumSet>
	) {
		super(publicKey);
	}

	toString(): string {
		return `vote(accept(${this.statement.toString()})) ratified by quorum (${Array.from(
			this.quorum.keys()
		)})`;
	}
}
