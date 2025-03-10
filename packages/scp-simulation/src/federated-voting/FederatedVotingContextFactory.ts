import { Overlay } from '../overlay';
import { FederatedVotingContext } from './FederatedVotingContext';
import { FederatedVotingProtocol } from './protocol/FederatedVotingProtocol';
import { PhaseTransitioner } from './protocol/phase-transitioner/PhaseTransitioner';

export class FederatedVotingContextFactory {
	static create(
		overlayFullyConnected = true,
		overlayGossipEnabled = false
	): FederatedVotingContext {
		return new FederatedVotingContext(
			new FederatedVotingProtocol(new PhaseTransitioner()),
			new Overlay(overlayFullyConnected, overlayGossipEnabled)
		);
	}
}
