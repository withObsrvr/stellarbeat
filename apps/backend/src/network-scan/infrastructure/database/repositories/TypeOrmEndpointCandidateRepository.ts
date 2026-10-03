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

	/**
	 * One save() for the whole set, so TypeORM loads the existing rows in a
	 * single SELECT and runs the writes inside one transaction, instead of a
	 * BEGIN/SELECT/UPDATE/COMMIT round trip per candidate. reload: false drops
	 * the post-write SELECT; nothing here reads the entity back.
	 */
	async saveCandidates(
		candidates: ValidatorEndpointCandidate[]
	): Promise<ValidatorEndpointCandidate[]> {
		if (candidates.length === 0) return [];
		return await this.candidateRepository.save(candidates, {
			chunk: 500,
			reload: false
		});
	}

	//Observations are append-only, so this is a plain multi-row INSERT rather
	//than save(), which would first SELECT to decide insert-vs-update.
	async saveObservations(
		observations: EndpointProbeObservation[]
	): Promise<void> {
		if (observations.length === 0) return;
		const chunkSize = 500;
		for (let index = 0; index < observations.length; index += chunkSize) {
			await this.observationRepository.insert(
				observations.slice(index, index + chunkSize)
			);
		}
	}
}
