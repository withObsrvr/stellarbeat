import { injectable } from 'inversify';
import { NodeTomlFetcher } from '../scan/NodeTomlFetcher';
import {
	CandidateSubmission,
	EndpointCandidateManager
} from './EndpointCandidateManager';
import ValidatorEndpointCandidate from './ValidatorEndpointCandidate';
import { ConnectionAttempt } from 'crawler';

export interface AdminCandidateSubmission extends CandidateSubmission {
	homeDomain?: string;
	tomlUrl?: string;
}

@injectable()
export class EndpointCandidateAdminService {
	constructor(
		private manager: EndpointCandidateManager,
		private nodeTomlFetcher: NodeTomlFetcher
	) {}

	async submit(
		input: AdminCandidateSubmission
	): Promise<ValidatorEndpointCandidate[]> {
		const domain = normalizeHomeDomain(input.homeDomain, input.tomlUrl);
		if (domain) {
			const declarations =
				await this.nodeTomlFetcher.fetchNodeTomlInfoCollection([domain]);
			if (declarations.size === 0)
				throw new Error(
					'No valid validator declarations found in stellar.toml'
				);
			return await this.manager.reconcileTomlDeclarations(declarations, {
				submitter: input.submitter ?? undefined,
				reason: input.reason ?? undefined
			});
		}

		return [await this.manager.submit(input)];
	}

	async list(): Promise<ValidatorEndpointCandidate[]> {
		return await this.manager.list();
	}

	async update(
		id: string,
		input: { enabled: boolean; expiresAt?: Date | null }
	): Promise<ValidatorEndpointCandidate | null> {
		return await this.manager.setEnabled(id, input.enabled, input.expiresAt);
	}

	async probe(id: string): Promise<ConnectionAttempt[]> {
		return await this.manager.probeCandidate(id);
	}
}

function normalizeHomeDomain(
	homeDomain?: string,
	tomlUrl?: string
): string | null {
	if (homeDomain) return homeDomain.toLowerCase();
	if (!tomlUrl) return null;
	const parsed = new URL(tomlUrl);
	if (parsed.protocol !== 'https:')
		throw new Error('stellar.toml URL must use HTTPS');
	if (parsed.pathname !== '/.well-known/stellar.toml')
		throw new Error('URL must point to /.well-known/stellar.toml');
	return parsed.hostname.toLowerCase();
}
