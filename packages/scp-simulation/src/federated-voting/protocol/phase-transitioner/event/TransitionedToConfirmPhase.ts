import { PublicKey } from '../../../../core';
import { FederatedVotingPhase } from '../../FederatedVotingProtocolState';
import { ProtocolEvent } from '../../event/ProtocolEvent';
import { Statement } from '../../Statement';

export class TransitionedToConfirmPhase extends ProtocolEvent {
	readonly subType = 'TransitionedToConfirmPhase';

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
