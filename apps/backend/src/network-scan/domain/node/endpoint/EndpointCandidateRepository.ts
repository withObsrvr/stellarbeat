import EndpointProbeObservation from './EndpointProbeObservation';
import ValidatorEndpointCandidate from './ValidatorEndpointCandidate';

export interface EndpointCandidateRepository {
	findById(id: string): Promise<ValidatorEndpointCandidate | null>;
	findByDedupeKey(key: string): Promise<ValidatorEndpointCandidate | null>;
	findForNetwork(networkId: string): Promise<ValidatorEndpointCandidate[]>;
	findEligibleForNetwork(
		networkId: string,
		at: Date
	): Promise<ValidatorEndpointCandidate[]>;
	saveCandidate(
		candidate: ValidatorEndpointCandidate
	): Promise<ValidatorEndpointCandidate>;
	saveObservation(
		observation: EndpointProbeObservation
	): Promise<EndpointProbeObservation>;
}
