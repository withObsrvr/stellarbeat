import { PublicKey } from '../../..';
import { ProtocolEvent } from '../ProtocolEvent';
import { Statement } from '../Statement';

export class ConsensusReached extends ProtocolEvent {
	readonly subType = 'ConsensusReached';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey.toString()}][${
			this.subType
		}] Consensus reached on ${this.statement.toString()}`;
	}
}
