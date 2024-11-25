import { FederatedVotingProtocol } from '../federated-voting-protocol/FederatedVotingProtocol';
import { PhaseTransitioner } from '../federated-voting-protocol/phase-transitioner/PhaseTransitioner';
import { FederatedVotingContext } from './FederatedVotingContext';

export class FederatedVotingContextFactory {
	static create(): FederatedVotingContext {
		return new FederatedVotingContext(
			new FederatedVotingProtocol(new PhaseTransitioner())
		);
	}
}
