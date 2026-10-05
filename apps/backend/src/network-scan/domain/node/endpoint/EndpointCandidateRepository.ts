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
	//Bulk variants. A crawl produces one observation per connection attempt --
	//well over a thousand per scan -- and saving those one at a time dominated
	//the scan's runtime, so the write path for a whole crawl goes through these.
	saveCandidates(
		candidates: ValidatorEndpointCandidate[]
	): Promise<ValidatorEndpointCandidate[]>;
	saveObservations(observations: EndpointProbeObservation[]): Promise<void>;
}
