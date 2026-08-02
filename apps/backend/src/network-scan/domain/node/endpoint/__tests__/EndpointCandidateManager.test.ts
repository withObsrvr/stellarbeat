import { mock } from 'jest-mock-extended';
import { ConnectionAttempt } from 'crawler';
import { ConfigMock } from '../../../../../core/config/__mocks__/configMock';
import { NodeAddress } from '../../NodeAddress';
import { NodeTomlInfo } from '../../scan/NodeTomlInfo';
import {
	EndpointCandidateManager,
	parseTomlHost
} from '../EndpointCandidateManager';
import { EndpointCandidateRepository } from '../EndpointCandidateRepository';
import { DnsAnswer, EndpointDnsResolver } from '../DnsResolver';
import EndpointProbeObservation from '../EndpointProbeObservation';
import { EndpointProbeService } from '../EndpointProbeService';
import ValidatorEndpointCandidate from '../ValidatorEndpointCandidate';

const MARKETNODE_KEYS = [
	'GBIRQBUX7DROBWBJ2X5BB2UQEDJSGCKJ3JPYJZOG2FRCNNJHFPUJANFJ',
	'GBW2FLMAZ4QSJ5ARLW57JQFLWUMBQUGWTIJ2AQ5CXUIHOSJWUE4S4BTA',
	'GCK4X6SCRYRXJZPNDLQNTD5WYZ63JV2VXKNFKNQ7CF7RPFT2NX7PPW7J'
];

class InMemoryEndpointCandidateRepository
	implements EndpointCandidateRepository
{
	candidates: ValidatorEndpointCandidate[] = [];
	observations: EndpointProbeObservation[] = [];
	private nextId = 1;

	async findById(id: string): Promise<ValidatorEndpointCandidate | null> {
		return this.candidates.find((candidate) => candidate.id === id) ?? null;
	}

	async findByDedupeKey(
		key: string
	): Promise<ValidatorEndpointCandidate | null> {
		return (
			this.candidates.find((candidate) => candidate.dedupeKey === key) ?? null
		);
	}

	async findForNetwork(
		networkId: string
	): Promise<ValidatorEndpointCandidate[]> {
		return this.candidates.filter(
			(candidate) => candidate.networkId === networkId
		);
	}

	async findEligibleForNetwork(
		networkId: string,
		at: Date
	): Promise<ValidatorEndpointCandidate[]> {
		return this.candidates.filter(
			(candidate) =>
				candidate.networkId === networkId && candidate.isEligible(at)
		);
	}

	async saveCandidate(
		candidate: ValidatorEndpointCandidate
	): Promise<ValidatorEndpointCandidate> {
		if (!candidate.id) {
			candidate.id = `candidate-${this.nextId++}`;
			this.candidates.push(candidate);
		}
		return candidate;
	}

	async saveObservation(
		observation: EndpointProbeObservation
	): Promise<EndpointProbeObservation> {
		observation.id = `observation-${this.observations.length + 1}`;
		this.observations.push(observation);
		return observation;
	}
}

describe('EndpointCandidateManager', () => {
	let repository: InMemoryEndpointCandidateRepository;
	let resolver: jest.Mocked<EndpointDnsResolver>;
	let probeService: jest.Mocked<EndpointProbeService>;
	let manager: EndpointCandidateManager;

	beforeEach(() => {
		repository = new InMemoryEndpointCandidateRepository();
		resolver = mock<EndpointDnsResolver>();
		probeService = mock<EndpointProbeService>();
		manager = new EndpointCandidateManager(
			repository,
			resolver,
			probeService,
			new ConfigMock()
		);
	});

	it('retains multiple IP candidates for the same validator identity', async () => {
		for (const ip of ['20.187.166.130', '10.0.0.10']) {
			await manager.upsert({
				networkId: 'test',
				expectedPublicKey: MARKETNODE_KEYS[0],
				ip,
				port: 11625,
				source: 'operator_submission'
			});
		}

		expect(await manager.list()).toHaveLength(2);
		expect((await manager.list()).map((candidate) => candidate.ip)).toEqual([
			'20.187.166.130',
			'10.0.0.10'
		]);
	});

	it('preserves a previously authenticated IP when DNS changes', async () => {
		const declaration = await manager.upsert({
			networkId: 'test',
			expectedPublicKey: MARKETNODE_KEYS[0],
			hostname: 'validator-1.stellar.marketnode.com',
			port: 11625,
			source: 'toml_declaration'
		});
		resolver.resolve
			.mockResolvedValueOnce([
				{ ip: '20.187.166.130', ttl: 60 } satisfies DnsAnswer
			])
			.mockResolvedValueOnce([
				{ ip: '20.198.213.76', ttl: 60 } satisfies DnsAnswer
			]);

		const [oldAddress] = await manager.resolveCandidate(declaration);
		await manager.recordConnectionAttempts([
			authenticatedAttempt(oldAddress.ip as string, MARKETNODE_KEYS[0])
		]);
		await manager.resolveCandidate(declaration);

		const addresses = (await manager.list()).filter(
			(candidate) => candidate.source === 'dns_resolution'
		);
		expect(addresses).toHaveLength(2);
		expect(
			addresses.find((candidate) => candidate.ip === '20.187.166.130')?.state
		).toBe('authenticated');
		expect(
			addresses.find((candidate) => candidate.ip === '20.198.213.76')?.state
		).toBe('unverified');
	});

	it('discovers all Marketnode validators from TOML declarations', async () => {
		const declarations = new Set(
			MARKETNODE_KEYS.map(
				(publicKey, index): NodeTomlInfo => ({
					publicKey,
					name: `Marketnode Validator ${index + 1}`,
					alias: `marketnode-${index + 1}`,
					host: `validator-${index + 1}.stellar.marketnode.com:11625`,
					historyUrl: null,
					homeDomain: 'stellar.marketnode.com'
				})
			)
		);
		resolver.resolve.mockImplementation(async (hostname) => [
			{
				ip: `20.0.0.${Number(hostname.match(/\d+/)?.[0] ?? 0)}`,
				ttl: 300
			}
		]);

		const candidates = await manager.reconcileTomlDeclarations(declarations);
		const resolved = candidates.filter(
			(candidate) => candidate.source === 'dns_resolution'
		);
		expect(resolved).toHaveLength(3);

		probeService.probe.mockImplementation(async (ip) => {
			const index = Number(ip.split('.').at(-1)) - 1;
			return authenticatedAttempt(ip, MARKETNODE_KEYS[index]);
		});
		const accepted = await manager.probePendingCandidates(candidates);

		expect(accepted.map((attempt) => attempt.remotePublicKey)).toEqual(
			MARKETNODE_KEYS
		);
		expect(repository.observations).toHaveLength(3);
	});

	it('quarantines an endpoint that authenticates as a different key', async () => {
		const candidate = await manager.upsert({
			networkId: 'test',
			expectedPublicKey: MARKETNODE_KEYS[0],
			ip: '20.187.166.130',
			port: 11625,
			source: 'operator_submission'
		});

		await manager.recordConnectionAttempts([
			authenticatedAttempt('20.187.166.130', MARKETNODE_KEYS[1])
		]);

		expect(candidate.state).toBe('quarantined');
		expect(repository.observations[0].outcome).toBe('unexpected_public_key');
	});

	it('stores a Creit-style TLS response as an overlay hello failure', async () => {
		const candidate = await manager.upsert({
			networkId: 'test',
			expectedPublicKey: MARKETNODE_KEYS[0],
			ip: '57.128.141.161',
			port: 11625,
			source: 'operator_submission'
		});
		const attemptedAt = new Date('2026-07-29T16:08:33Z');

		await manager.recordConnectionAttempts([
			{
				address: '57.128.141.161:11625',
				ip: '57.128.141.161',
				port: 11625,
				attemptedAt,
				completedAt: new Date(attemptedAt.getTime() + 25),
				outcome: 'tls_detected',
				failureStage: 'overlay_hello',
				errorCode: 'OVERLAY_TLS_DETECTED',
				sanitizedDetail: 'TLS record received on Stellar overlay port'
			}
		]);

		expect(candidate.state).toBe('failed');
		expect(repository.observations[0]).toMatchObject({
			outcome: 'tls_detected',
			failureStage: 'overlay_hello',
			errorCode: 'OVERLAY_TLS_DETECTED'
		});
	});

	it('does not amplify failed gossip addresses into the next crawl seed', async () => {
		await manager.recordConnectionAttempts([
			failedAttempt('8.8.8.8'),
			authenticatedAttempt('1.1.1.1', MARKETNODE_KEYS[0])
		]);
		const configured = NodeAddress.create('9.9.9.9', 11625);
		if (configured.isErr()) throw configured.error;

		const addresses = await manager.prepareScanCandidates([configured.value]);

		expect(addresses.map((address) => address.ip)).toEqual([
			'9.9.9.9',
			'1.1.1.1'
		]);
		expect(addresses.map((address) => address.ip)).not.toContain('8.8.8.8');
	});

	it('parses TOML hosts with or without an explicit scheme', () => {
		expect(parseTomlHost('validator.example.com:11625')).toEqual({
			hostname: 'validator.example.com',
			ip: null,
			port: 11625
		});
		expect(parseTomlHost('tcp://192.0.2.10:11626')).toEqual({
			hostname: null,
			ip: '192.0.2.10',
			port: 11626
		});
	});
});

function authenticatedAttempt(
	ip: string,
	publicKey: string
): ConnectionAttempt {
	const attemptedAt = new Date('2026-07-29T20:25:13Z');
	return {
		address: `${ip}:11625`,
		ip,
		port: 11625,
		attemptedAt,
		completedAt: new Date(attemptedAt.getTime() + 100),
		outcome: 'authenticated',
		remotePublicKey: publicKey
	};
}

function failedAttempt(ip: string): ConnectionAttempt {
	const attemptedAt = new Date('2026-07-29T20:25:13Z');
	return {
		address: `${ip}:11625`,
		ip,
		port: 11625,
		attemptedAt,
		completedAt: new Date(attemptedAt.getTime() + 100),
		outcome: 'tcp_refused',
		failureStage: 'tcp',
		errorCode: 'ECONNREFUSED',
		sanitizedDetail: 'Connection refused'
	};
}
