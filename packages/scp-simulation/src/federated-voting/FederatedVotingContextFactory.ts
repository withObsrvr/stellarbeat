import { FederatedVotingContext } from './FederatedVotingContext';
import { FederatedVotingProtocol } from './protocol/FederatedVotingProtocol';
import { PhaseTransitioner } from './protocol/phase-transitioner/PhaseTransitioner';

export class FederatedVotingContextFactory {
	static create(): FederatedVotingContext {
		return new FederatedVotingContext(
			new FederatedVotingProtocol(new PhaseTransitioner())
		);
	}
}
