import { PublicKey } from '../../..';
import { FederatedVotingPhase } from '../../FederatedVotingState';
import { ProtocolEvent } from '../../ProtocolEvent';
import { Statement } from '../../Statement';

export class TransitionedToConfirmPhase extends ProtocolEvent {
	readonly subType = 'TransitionedToConfirmPhase';

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
