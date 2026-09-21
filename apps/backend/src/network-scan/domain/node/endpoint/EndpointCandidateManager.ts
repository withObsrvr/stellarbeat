import { inject, injectable } from 'inversify';
import { ConnectionAttempt, ConnectionAttemptOutcome } from 'crawler';
import validator from 'validator';
import { Config } from '../../../../core/config/Config';
import { NETWORK_TYPES } from '../../../infrastructure/di/di-types';
import { NodeAddress } from '../NodeAddress';
import { NodeTomlInfo } from '../scan/NodeTomlInfo';
import { EndpointCandidateRepository } from './EndpointCandidateRepository';
import { EndpointDnsResolver } from './DnsResolver';
import { isPublicIpAddress } from './EndpointAddressPolicy';
import EndpointProbeObservation from './EndpointProbeObservation';
import { EndpointProbeService } from './EndpointProbeService';
import ValidatorEndpointCandidate, {
	ValidatorEndpointCandidateProps
} from './ValidatorEndpointCandidate';

export interface CandidateSubmission {
	expectedPublicKey?: string | null;
	hostname?: string | null;
	ip?: string | null;
	port?: number;
	sourceReference?: string | null;
	submitter?: string | null;
	reason?: string | null;
	expiresAt?: Date | null;
}

@injectable()
export class EndpointCandidateManager {
	private static readonly MAX_DNS_ANSWERS_PER_HOST = 8;
	private static readonly MAX_CANDIDATES_TO_RESOLVE = 256;
	private static readonly MAX_ADDITIONAL_SCAN_ADDRESSES = 64;

	constructor(
		@inject(NETWORK_TYPES.EndpointCandidateRepository)
		private repository: EndpointCandidateRepository,
		@inject(NETWORK_TYPES.EndpointDnsResolver)
		private dnsResolver: EndpointDnsResolver,
		private endpointProbeService: EndpointProbeService,
		@inject('Config') private config: Config
	) {}

	async upsert(
		props: ValidatorEndpointCandidateProps
	): Promise<ValidatorEndpointCandidate> {
		this.validateCandidate(props);
		const key = ValidatorEndpointCandidate.buildDedupeKey(props);
		const existing = await this.repository.findByDedupeKey(key);
		if (existing) {
			existing.seen();
			if (props.reason) existing.reason = props.reason;
			if (props.submitter) existing.submitter = props.submitter;
			if (props.expiresAt !== undefined) existing.expiresAt = props.expiresAt;
			return await this.repository.saveCandidate(existing);
		}

		return await this.repository.saveCandidate(
			ValidatorEndpointCandidate.create(props)
		);
	}

	async submit(
		input: CandidateSubmission
	): Promise<ValidatorEndpointCandidate> {
		return await this.upsert({
			networkId: this.config.networkConfig.networkId,
			expectedPublicKey: input.expectedPublicKey,
			hostname: input.hostname,
			ip: input.ip,
			port: input.port ?? 11625,
			source: 'operator_submission',
			sourceReference: input.sourceReference,
			submitter: input.submitter,
			reason: input.reason,
			expiresAt: input.expiresAt
		});
	}

	async list(): Promise<ValidatorEndpointCandidate[]> {
		return await this.repository.findForNetwork(
			this.config.networkConfig.networkId
		);
	}

	async setEnabled(
		id: string,
		enabled: boolean,
		expiresAt?: Date | null
	): Promise<ValidatorEndpointCandidate | null> {
		const candidate = await this.repository.findById(id);
		if (
			!candidate ||
			candidate.networkId !== this.config.networkConfig.networkId
		)
			return null;
		candidate.setEnabled(enabled);
		if (expiresAt !== undefined) candidate.expiresAt = expiresAt;
		return await this.repository.saveCandidate(candidate);
	}

	async prepareScanCandidates(
		configuredPeers: NodeAddress[]
	): Promise<NodeAddress[]> {
		const unique = new Map<string, NodeAddress>();
		for (const peer of configuredPeers) {
			unique.set(`${peer.ip}:${peer.port}`, peer);
			await this.upsert({
				networkId: this.config.networkConfig.networkId,
				ip: peer.ip,
				port: peer.port,
				source: 'configured_seed',
				sourceReference: 'NETWORK_KNOWN_PEERS'
			});
		}

		const eligible = (
			await this.repository.findEligibleForNetwork(
				this.config.networkConfig.networkId,
				new Date()
			)
		).filter(
			(candidate) =>
				candidate.state !== 'failed' &&
				candidate.state !== 'quarantined' &&
				candidate.state !== 'disabled'
		);
		const resolved: ValidatorEndpointCandidate[] = [];
		for (const candidate of eligible.slice(
			0,
			EndpointCandidateManager.MAX_CANDIDATES_TO_RESOLVE
		)) {
			resolved.push(...(await this.resolveCandidate(candidate)));
		}

		const maximumAddressCount =
			unique.size + EndpointCandidateManager.MAX_ADDITIONAL_SCAN_ADDRESSES;
		for (const candidate of [...eligible, ...resolved]) {
			if (unique.size >= maximumAddressCount) break;
			if (!candidate.ip || !candidate.isEligible()) continue;
			const address = NodeAddress.create(candidate.ip, candidate.port);
			if (address.isOk())
				unique.set(`${candidate.ip}:${candidate.port}`, address.value);
		}
		return Array.from(unique.values());
	}

	async resolveCandidate(
		candidate: ValidatorEndpointCandidate
	): Promise<ValidatorEndpointCandidate[]> {
		if (!candidate.hostname) return candidate.ip ? [candidate] : [];
		const answers = (await this.dnsResolver.resolve(candidate.hostname)).slice(
			0,
			EndpointCandidateManager.MAX_DNS_ANSWERS_PER_HOST
		);
		const resolvedAt = new Date();
		candidate.resolved(
			resolvedAt,
			answers.reduce<number | null>(
				(minimum, answer) =>
					minimum === null
						? answer.ttl
						: answer.ttl === null
							? minimum
							: Math.min(minimum, answer.ttl),
				null
			)
		);
		await this.repository.saveCandidate(candidate);

		const resolved: ValidatorEndpointCandidate[] = [];
		for (const answer of answers) {
			if (
				!this.config.allowPrivateEndpointCandidates &&
				!isPublicIpAddress(answer.ip)
			)
				continue;
			const child = await this.upsert({
				networkId: candidate.networkId,
				expectedPublicKey: candidate.expectedPublicKey,
				hostname: candidate.hostname,
				ip: answer.ip,
				port: candidate.port,
				source: 'dns_resolution',
				sourceReference: candidate.id
			});
			child.resolved(resolvedAt, answer.ttl);
			resolved.push(await this.repository.saveCandidate(child));
		}
		return resolved;
	}

	async reconcileTomlDeclarations(
		declarations: Set<NodeTomlInfo>,
		metadata: { submitter?: string; reason?: string } = {}
	): Promise<ValidatorEndpointCandidate[]> {
		const candidates: ValidatorEndpointCandidate[] = [];
		for (const declaration of declarations) {
			const endpoint = parseTomlHost(declaration.host);
			const candidate = await this.upsert({
				networkId: this.config.networkConfig.networkId,
				expectedPublicKey: declaration.publicKey,
				hostname: endpoint?.hostname ?? null,
				ip: endpoint?.ip ?? null,
				port: endpoint?.port ?? 11625,
				source: 'toml_declaration',
				sourceReference: declaration.homeDomain,
				submitter: metadata.submitter,
				reason: metadata.reason
			});
			candidates.push(candidate);
			candidates.push(...(await this.resolveCandidate(candidate)));
		}
		return candidates;
	}

	async recordConnectionAttempts(
		attempts: ConnectionAttempt[],
		scanId: string | null = null
	): Promise<void> {
		const candidates = await this.repository.findForNetwork(
			this.config.networkConfig.networkId
		);
		const candidatesByAddress = new Map<string, ValidatorEndpointCandidate[]>();
		for (const candidate of candidates) {
			if (!candidate.ip) continue;
			const address = `${candidate.ip}:${candidate.port}`;
			const addressCandidates = candidatesByAddress.get(address) ?? [];
			addressCandidates.push(candidate);
			candidatesByAddress.set(address, addressCandidates);
		}
		for (const attempt of attempts) {
			const address = `${attempt.ip}:${attempt.port}`;
			let matches = candidatesByAddress.get(address) ?? [];
			if (matches.length === 0) {
				const discovered = await this.upsert({
					networkId: this.config.networkConfig.networkId,
					expectedPublicKey: attempt.remotePublicKey,
					ip: attempt.ip,
					port: attempt.port,
					source: 'peer_gossip'
				});
				candidates.push(discovered);
				matches = [discovered];
				candidatesByAddress.set(address, matches);
			}

			for (const candidate of matches) {
				const wrongKey =
					attempt.outcome === 'authenticated' &&
					candidate.expectedPublicKey !== null &&
					attempt.remotePublicKey !== candidate.expectedPublicKey;
				const outcome: ConnectionAttemptOutcome = wrongKey
					? 'unexpected_public_key'
					: attempt.outcome;
				await this.repository.saveObservation(
					EndpointProbeObservation.fromConnectionAttempt(
						candidate.id,
						attempt,
						{
							scanId,
							outcome
						}
					)
				);

				if (wrongKey) candidate.quarantine(attempt.completedAt);
				else if (attempt.outcome === 'authenticated' && attempt.remotePublicKey)
					candidate.authenticated(attempt.remotePublicKey, attempt.completedAt);
				else candidate.failed(attempt.completedAt);
				await this.repository.saveCandidate(candidate);
			}
		}
	}

	async probeCandidate(id: string): Promise<ConnectionAttempt[]> {
		const candidate = await this.repository.findById(id);
		if (
			!candidate ||
			candidate.networkId !== this.config.networkConfig.networkId
		)
			throw new Error('Endpoint candidate not found');
		if (!candidate.isEligible())
			throw new Error('Endpoint candidate is disabled or expired');
		const targets = await this.resolveCandidate(candidate);
		const attempts: ConnectionAttempt[] = [];
		for (const target of targets.length > 0 ? targets : [candidate]) {
			if (!target.ip) continue;
			attempts.push(
				await this.endpointProbeService.probe(target.ip, target.port)
			);
		}
		await this.recordConnectionAttempts(attempts);
		return attempts;
	}

	async probePendingCandidates(
		candidates: ValidatorEndpointCandidate[],
		budget = this.config.endpointDeltaProbeBudget
	): Promise<ConnectionAttempt[]> {
		const targets = new Map<string, ValidatorEndpointCandidate>();
		for (const candidate of candidates) {
			if (
				!candidate.ip ||
				!candidate.isEligible() ||
				candidate.state === 'authenticated' ||
				candidate.state === 'quarantined'
			)
				continue;
			targets.set(`${candidate.ip}:${candidate.port}`, candidate);
		}

		const acceptedAttempts: ConnectionAttempt[] = [];
		const allAttempts: ConnectionAttempt[] = [];
		for (const candidate of Array.from(targets.values()).slice(0, budget)) {
			const attempt = await this.endpointProbeService.probe(
				candidate.ip as string,
				candidate.port
			);
			allAttempts.push(attempt);
			if (
				attempt.outcome === 'authenticated' &&
				attempt.remotePublicKey &&
				(candidate.expectedPublicKey === null ||
					candidate.expectedPublicKey === attempt.remotePublicKey)
			)
				acceptedAttempts.push(attempt);
		}
		await this.recordConnectionAttempts(allAttempts);
		return acceptedAttempts;
	}

	private validateCandidate(props: ValidatorEndpointCandidateProps): void {
		if (!validator.isPort(String(props.port)))
			throw new Error('Invalid endpoint port');
		if (
			props.expectedPublicKey &&
			!validator.matches(props.expectedPublicKey, /^G[A-Z2-7]{55}$/)
		)
			throw new Error('Invalid expected validator public key');
		if (!props.hostname && !props.ip && !props.expectedPublicKey)
			throw new Error(
				'Candidate requires a hostname, IP, or expected public key'
			);
		if (props.hostname && !validator.isFQDN(props.hostname))
			throw new Error('Invalid endpoint hostname');
		if (props.ip) {
			if (!validator.isIP(props.ip)) throw new Error('Invalid endpoint IP');
			if (
				!this.config.allowPrivateEndpointCandidates &&
				!isPublicIpAddress(props.ip)
			)
				throw new Error(
					'Private, loopback, link-local, and multicast IPs are not allowed'
				);
		}
	}
}

export function parseTomlHost(
	host: string | null
): { hostname: string | null; ip: string | null; port: number } | null {
	if (!host) return null;
	try {
		const parsed = new URL(host.includes('://') ? host : `tcp://${host}`);
		const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
		return {
			hostname: validator.isIP(hostname) ? null : hostname.toLowerCase(),
			ip: validator.isIP(hostname) ? hostname : null,
			port: parsed.port ? Number(parsed.port) : 11625
		};
	} catch {
		return null;
	}
}
