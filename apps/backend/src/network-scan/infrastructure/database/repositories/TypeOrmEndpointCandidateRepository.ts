import { IsNull, MoreThan, Repository } from 'typeorm';
import { EndpointCandidateRepository } from '../../../domain/node/endpoint/EndpointCandidateRepository';
import EndpointProbeObservation from '../../../domain/node/endpoint/EndpointProbeObservation';
import ValidatorEndpointCandidate from '../../../domain/node/endpoint/ValidatorEndpointCandidate';

export class TypeOrmEndpointCandidateRepository
	implements EndpointCandidateRepository
{
	constructor(
		private candidateRepository: Repository<ValidatorEndpointCandidate>,
		private observationRepository: Repository<EndpointProbeObservation>
	) {}

	async findById(id: string): Promise<ValidatorEndpointCandidate | null> {
		return await this.candidateRepository.findOneBy({ id });
	}

	async findByDedupeKey(
		key: string
	): Promise<ValidatorEndpointCandidate | null> {
		return await this.candidateRepository.findOneBy({ dedupeKey: key });
	}

	async findForNetwork(
		networkId: string
	): Promise<ValidatorEndpointCandidate[]> {
		return await this.candidateRepository.find({
			where: { networkId },
			order: { lastSeenAt: 'DESC' }
		});
	}

	async findEligibleForNetwork(
		networkId: string,
		at: Date
	): Promise<ValidatorEndpointCandidate[]> {
		return await this.candidateRepository.find({
			where: [
				{ networkId, enabled: true, expiresAt: IsNull() },
				{ networkId, enabled: true, expiresAt: MoreThan(at) }
			],
			order: { lastSeenAt: 'DESC' }
		});
	}

	async saveCandidate(
		candidate: ValidatorEndpointCandidate
	): Promise<ValidatorEndpointCandidate> {
		return await this.candidateRepository.save(candidate);
	}

	async saveObservation(
		observation: EndpointProbeObservation
	): Promise<EndpointProbeObservation> {
		return await this.observationRepository.save(observation);
	}
}
