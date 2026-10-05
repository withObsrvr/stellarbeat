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
	private static readonly GOSSIP_FAILURE_COOLDOWN_MS = 15 * 60 * 1000;
	private static readonly DNS_FALLBACK_TTL_SECONDS = 300;
	private static readonly NETWORK_CONCURRENCY = 8;

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
		const now = new Date();
		const expiredHostCandidates = eligible.filter(
			(candidate) =>
				candidate.hostname !== null && this.dnsResolutionExpired(candidate, now)
		);
		//A declaration and each of its DNS-derived children share a hostname.
		//Refresh that hostname once; resolving every child concurrently races the
		//unique candidate key when DNS publishes a new address.
		const candidatesByHostname = new Map<string, ValidatorEndpointCandidate>();
		for (const candidate of expiredHostCandidates) {
			const key = [
				candidate.networkId,
				candidate.expectedPublicKey ?? '',
				candidate.hostname,
				candidate.port
			].join('|');
			const current = candidatesByHostname.get(key);
			if (!current || (current.ip !== null && candidate.ip === null))
				candidatesByHostname.set(key, candidate);
		}
		const hostCandidates = Array.from(candidatesByHostname.values()).slice(
			0,
			Math.min(
				EndpointCandidateManager.MAX_CANDIDATES_TO_RESOLVE,
				EndpointCandidateManager.MAX_ADDITIONAL_SCAN_ADDRESSES
			)
		);
		const resolved = (
			await this.mapWithConcurrency(
				hostCandidates,
				EndpointCandidateManager.NETWORK_CONCURRENCY,
				(candidate) => this.resolveCandidate(candidate)
			)
		).flat();

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

	async getRecentlyFailedGossipAddresses(
		at = new Date()
	): Promise<Set<string>> {
		const candidates = await this.repository.findForNetwork(
			this.config.networkConfig.networkId
		);
		const byAddress = new Map<string, ValidatorEndpointCandidate[]>();
		for (const candidate of candidates) {
			if (!candidate.ip) continue;
			const address = `${candidate.ip}:${candidate.port}`;
			const matches = byAddress.get(address) ?? [];
			matches.push(candidate);
			byAddress.set(address, matches);
		}

		const cutoff =
			at.getTime() - EndpointCandidateManager.GOSSIP_FAILURE_COOLDOWN_MS;
		const suppressed = new Set<string>();
		for (const [address, matches] of byAddress) {
			const hasTrustedEvidence = matches.some(
				(candidate) =>
					candidate.state === 'authenticated' ||
					candidate.source !== 'peer_gossip'
			);
			if (hasTrustedEvidence) continue;
			if (
				matches.some(
					(candidate) =>
						candidate.state === 'failed' &&
						candidate.lastAttemptedAt !== null &&
						candidate.lastAttemptedAt.getTime() >= cutoff
				)
			)
				suppressed.add(address);
		}
		return suppressed;
	}

	private dnsResolutionExpired(
		candidate: ValidatorEndpointCandidate,
		at: Date
	): boolean {
		if (candidate.lastResolvedAt === null) return true;
		const ttlSeconds =
			candidate.dnsTtl ?? EndpointCandidateManager.DNS_FALLBACK_TTL_SECONDS;
		return (
			candidate.lastResolvedAt.getTime() + ttlSeconds * 1000 <= at.getTime()
		);
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

	/**
	 * Fold a crawl's connection attempts into the candidate set.
	 *
	 * A pubnet crawl reports ~1400 attempts. Writing each one as it was
	 * processed meant two separately-transacted statements per attempt, and the
	 * resulting ~2900 serial round trips took roughly fifteen minutes -- longer
	 * than the rest of the scan put together, and long enough that the scanner
	 * never got an idle gap between runs. So the loop below only reads and
	 * mutates in memory; every write happens afterwards, in bulk.
	 */
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

		const discovered: ValidatorEndpointCandidate[] = [];
		const touched = new Set<ValidatorEndpointCandidate>();
		//Observations reference candidate.id, which the database assigns, so the
		//pairs are held until the newly discovered candidates have been inserted.
		const recorded: {
			candidate: ValidatorEndpointCandidate;
			attempt: ConnectionAttempt;
			outcome: ConnectionAttemptOutcome;
		}[] = [];

		for (const attempt of attempts) {
			const address = `${attempt.ip}:${attempt.port}`;
			let matches = candidatesByAddress.get(address) ?? [];
			if (matches.length === 0) {
				const candidate = this.createDiscoveredCandidate(attempt);
				//A gossiped address can be unroutable or otherwise invalid. That is
				//one peer's problem, not the batch's, so skip it and keep going.
				if (candidate === null) continue;
				discovered.push(candidate);
				matches = [candidate];
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

				if (wrongKey) candidate.quarantine(attempt.completedAt);
				else if (attempt.outcome === 'authenticated' && attempt.remotePublicKey)
					candidate.authenticated(attempt.remotePublicKey, attempt.completedAt);
				else candidate.failed(attempt.completedAt);

				touched.add(candidate);
				recorded.push({ candidate, attempt, outcome });
			}
		}

		//Insert first: the observations below need the generated ids.
		if (discovered.length > 0) {
			await this.repository.saveCandidates(discovered);
			candidates.push(...discovered);
			discovered.forEach((candidate) => touched.delete(candidate));
		}
		await this.repository.saveCandidates(Array.from(touched));
		await this.repository.saveObservations(
			recorded.map(({ candidate, attempt, outcome }) =>
				EndpointProbeObservation.fromConnectionAttempt(candidate.id, attempt, {
					scanId,
					outcome
				})
			)
		);
	}

	//The in-memory half of upsert() for a gossiped address: no dedupe lookup,
	//because the caller already holds every candidate on the network.
	private createDiscoveredCandidate(
		attempt: ConnectionAttempt
	): ValidatorEndpointCandidate | null {
		const props: ValidatorEndpointCandidateProps = {
			networkId: this.config.networkConfig.networkId,
			expectedPublicKey: attempt.remotePublicKey,
			ip: attempt.ip,
			port: attempt.port,
			source: 'peer_gossip'
		};
		try {
			this.validateCandidate(props);
		} catch {
			return null;
		}
		return ValidatorEndpointCandidate.create(props);
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
		const attempts = await this.mapWithConcurrency(
			Array.from(targets.values()).slice(0, budget),
			EndpointCandidateManager.NETWORK_CONCURRENCY,
			(candidate) =>
				this.endpointProbeService.probe(candidate.ip as string, candidate.port)
		);
		for (const attempt of attempts) {
			allAttempts.push(attempt);
			const candidate = targets.get(`${attempt.ip}:${attempt.port}`);
			if (
				attempt.outcome === 'authenticated' &&
				attempt.remotePublicKey &&
				candidate &&
				(candidate.expectedPublicKey === null ||
					candidate.expectedPublicKey === attempt.remotePublicKey)
			)
				acceptedAttempts.push(attempt);
		}
		await this.recordConnectionAttempts(allAttempts);
		return acceptedAttempts;
	}

	private async mapWithConcurrency<T, R>(
		values: T[],
		concurrency: number,
		mapper: (value: T) => Promise<R>
	): Promise<R[]> {
		const results: R[] = [];
		for (let index = 0; index < values.length; index += concurrency) {
			results.push(
				...(await Promise.all(
					values.slice(index, index + concurrency).map(mapper)
				))
			);
		}
		return results;
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
