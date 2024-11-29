import { PublicKey } from '../../../core';
import { ProtocolEvent } from './ProtocolEvent';
import { Statement } from '../Statement';

export class ConsensusReached extends ProtocolEvent {
	readonly subType = 'ConsensusReached';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly statement: Statement
	) {
		super(publicKey);
	}

	toString(): string {
		return `Consensus reached on ${this.statement.toString()}`;
	}
}
