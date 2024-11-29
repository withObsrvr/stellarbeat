import { PublicKey } from '../../../../core';
import { FederatedVotingPhase } from '../../FederatedVotingProtocolState';
import { ProtocolEvent } from '../../event/ProtocolEvent';
import { Statement } from '../../Statement';

export class TransitionedToAcceptPhase extends ProtocolEvent {
	readonly subType = 'TransitionedToAcceptPhase';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly phase: FederatedVotingPhase,
		public readonly statement: Statement
	) {
		super(publicKey);
	}

	toString(): string {
		return `${this.statement.toString()}`;
	}
}
