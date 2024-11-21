import { PublicKey, Statement } from '../../..';
import { FederatedVotingPhase } from '../../FederatedVotingState';
import { ProtocolEvent } from '../../ProtocolEvent';

export class TransitionedToAcceptPhase extends ProtocolEvent {
	readonly subType = 'TransitionedToAcceptPhase';
	constructor(
		public readonly publicKey: PublicKey,
		public readonly phase: FederatedVotingPhase,
		public readonly statement: Statement
	) {
		super();
	}

	toString(): string {
		return `[${this.publicKey}][${this.subType}] Federated vote moved to phase ${
			this.phase
		} with statement ${this.statement.toString()}`;
	}
}
