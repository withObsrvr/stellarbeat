import { PythonFbasAdapter, IPythonFbasHttpClient } from '../PythonFbasAdapter';
import { FbasAggregator } from '../FbasAggregator';
import { FbasFilteredAnalyzer } from '../FbasFilteredAnalyzer';
import {
	createNodeWithQuorumSet,
	createOrganizationWithValidators,
	createNodeWithGeoData,
	createNodeWithISP
} from '../__fixtures__/test-helpers';
import { ok, err } from 'neverthrow';
import Node from '../../../../node/Node';

describe('PythonFbasAdapter', () => {
	let adapter: PythonFbasAdapter;
	let mockHttpClient: jest.Mocked<IPythonFbasHttpClient>;
	let aggregator: FbasAggregator;
	let filteredAnalyzer: FbasFilteredAnalyzer;
	const time = new Date();

	beforeEach(() => {
		// Create mock HTTP client
		mockHttpClient = {
			analyzeTopTier: jest.fn(),
			analyzeBlockingSets: jest.fn(),
			analyzeSplittingSets: jest.fn(),
			analyzeQuorums: jest.fn(),
			healthCheck: jest.fn()
		};

		aggregator = new FbasAggregator();
		filteredAnalyzer = new FbasFilteredAnalyzer();

		adapter = new PythonFbasAdapter(
			mockHttpClient,
			aggregator,
			filteredAnalyzer
		);
	});

	describe('analyze', () => {
		it('should perform complete analysis at all levels', async () => {
			// Setup nodes
			const nodes = Array(5)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{
							threshold: 1,
							validators: ['A', 'B'],
							innerQuorumSets: []
						},
						true,
						time
					)
				);

			// Set geo data and ISP
			nodes.forEach((node) => {
				const geoData = node.geoData;
				if (geoData) {
					node.updateGeoData(geoData, time);
				} else {
					const newGeoData =
						require('../../../../node/NodeGeoDataLocation').default.create(
							0,
							0,
							'United States',
							'US'
						);
					node.updateGeoData(newGeoData, time);
				}
				node.updateIsp('Amazon AWS', time);
			});

			const org = createOrganizationWithValidators(
				nodes.map((n) => n.publicKey),
				'Test Org',
				time
			);

			// Setup mock responses
			mockHttpClient.analyzeTopTier.mockResolvedValue(
				ok({ top_tier: ['A', 'B'], top_tier_size: 2 })
			);
			mockHttpClient.analyzeBlockingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 2,
					example_set: ['A'],
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeSplittingSets.mockResolvedValue(
				ok({
					min_size: 2,
					total_sets: 1,
					example_set: ['A', 'B'],
					has_split: false,
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeQuorums.mockResolvedValue(
				ok({
					quorum_intersection: true,
					min_size: 3,
					total_quorums: 1,
					example_quorum: ['A', 'B', 'C'],
					execution_time_ms: 100
				})
			);

			const result = await adapter.analyze(nodes, [org]);

			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const analysis = result.value;

				// Check structure
				expect(analysis.hasQuorumIntersection).toBe(true);
				expect(analysis.node).toBeDefined();
				expect(analysis.organization).toBeDefined();
				expect(analysis.country).toBeDefined();
				expect(analysis.isp).toBeDefined();

				// Check node level results
				expect(analysis.node.topTierSize).toBe(2);
				expect(analysis.node.blockingSetsMinSize).toBe(1);
				expect(analysis.node.blockingSetsFilteredMinSize).toBe(1);
				expect(analysis.node.splittingSetsMinSize).toBe(2);

				// Verify HTTP client was called for all levels
				// Node level: 4 calls (top tier, blocking all, blocking filtered, splitting)
				// Org level: 4 calls
				// Country level: 4 calls
				// ISP level: 4 calls
				// Quorum intersection: 1 call
				// Total: 17 calls
				expect(mockHttpClient.analyzeTopTier).toHaveBeenCalledTimes(4);
				expect(mockHttpClient.analyzeBlockingSets).toHaveBeenCalledTimes(8); // 2x per level (all + filtered)
				expect(mockHttpClient.analyzeSplittingSets).toHaveBeenCalledTimes(4);
				expect(mockHttpClient.analyzeQuorums).toHaveBeenCalledTimes(1);
			}
		});

		it('should handle nodes without valid quorum sets', async () => {
			const node = createNodeWithQuorumSet(
				{ threshold: 1, validators: [], innerQuorumSets: [] },
				true,
				time
			);
			node.demoteToWatcher(time); // Remove quorum set

			const result = await adapter.analyze([node], []);

			expect(result.isErr()).toBe(true);
			if (result.isErr()) {
				expect(result.error.message).toContain('No nodes with valid quorum sets');
			}
		});

		it('should handle HTTP client errors gracefully', async () => {
			const node = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['A'],
					innerQuorumSets: []
				},
				true,
				time
			);

			// Mock error from HTTP client
			mockHttpClient.analyzeTopTier.mockRejectedValue(
				new Error('Service unavailable')
			);

			const result = await adapter.analyze([node], []);

			expect(result.isErr()).toBe(true);
		});
	});

	describe('analyzeNodeLevel', () => {
		it('should run filtered and unfiltered analyses', async () => {
			const validatingNode = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['A'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const nonValidatingNode = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['B'],
					innerQuorumSets: []
				},
				false,
				time
			);

			mockHttpClient.analyzeTopTier.mockResolvedValue(
				ok({ top_tier: ['A', 'B'], top_tier_size: 2 })
			);
			mockHttpClient.analyzeBlockingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 1,
					example_set: ['A'],
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeSplittingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 1,
					example_set: ['A'],
					has_split: false,
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeQuorums.mockResolvedValue(
				ok({
					quorum_intersection: true,
					min_size: 2,
					total_quorums: 1,
					example_quorum: ['A', 'B'],
					execution_time_ms: 100
				})
			);

			const result = await adapter.analyze(
				[validatingNode, nonValidatingNode],
				[]
			);

			expect(result.isOk()).toBe(true);

			// Verify blocking sets called twice for node level (all + filtered)
			const blockingCalls = mockHttpClient.analyzeBlockingSets.mock.calls;
			expect(blockingCalls.length).toBeGreaterThan(0);

			// One call should have 2 nodes (all), another should have 1 node (validating only)
			const nodeCounts = blockingCalls.map((call) => call[0].nodes.length);
			expect(nodeCounts).toContain(2); // All nodes
			expect(nodeCounts).toContain(1); // Validating only
		});
	});

	describe('analyzeOrganizationLevel', () => {
		it('should aggregate by organization before analysis', async () => {
			const nodes = Array(3)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{
							threshold: 1,
							validators: ['EXT'],
							innerQuorumSets: []
						},
						true,
						time
					)
				);

			const org = createOrganizationWithValidators(
				nodes.map((n) => n.publicKey),
				'Test Org',
				time
			);

			mockHttpClient.analyzeTopTier.mockResolvedValue(
				ok({ top_tier: [org.organizationId.value], top_tier_size: 1 })
			);
			mockHttpClient.analyzeBlockingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 1,
					example_set: [org.organizationId.value],
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeSplittingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 0,
					example_set: [],
					has_split: false,
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeQuorums.mockResolvedValue(
				ok({
					quorum_intersection: true,
					min_size: 1,
					total_quorums: 1,
					example_quorum: [org.organizationId.value],
					execution_time_ms: 100
				})
			);

			const result = await adapter.analyze(nodes, [org]);

			expect(result.isOk()).toBe(true);

			// Verify organization level was called with aggregated nodes
			const topTierCalls = mockHttpClient.analyzeTopTier.mock.calls;
			const orgLevelCall = topTierCalls.find(
				(call) =>
					call[0].nodes.length === 1 &&
					call[0].nodes[0].publicKey === org.organizationId.value
			);
			expect(orgLevelCall).toBeDefined();
		});
	});

	describe('analyzeCountryLevel', () => {
		it('should aggregate by country before analysis', async () => {
			const nodes = Array(3)
				.fill(null)
				.map(() => createNodeWithGeoData('United States', true, time));

			mockHttpClient.analyzeTopTier.mockResolvedValue(
				ok({ top_tier: ['United States'], top_tier_size: 1 })
			);
			mockHttpClient.analyzeBlockingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 1,
					example_set: ['United States'],
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeSplittingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 0,
					example_set: [],
					has_split: false,
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeQuorums.mockResolvedValue(
				ok({
					quorum_intersection: true,
					min_size: 1,
					total_quorums: 1,
					example_quorum: ['United States'],
					execution_time_ms: 100
				})
			);

			const result = await adapter.analyze(nodes, []);

			expect(result.isOk()).toBe(true);

			// Verify country level was called with aggregated nodes
			const topTierCalls = mockHttpClient.analyzeTopTier.mock.calls;
			const countryLevelCall = topTierCalls.find(
				(call) =>
					call[0].nodes.length === 1 &&
					call[0].nodes[0].publicKey === 'United States'
			);
			expect(countryLevelCall).toBeDefined();
		});
	});

	describe('analyzeISPLevel', () => {
		it('should aggregate by ISP before analysis', async () => {
			const nodes = Array(3)
				.fill(null)
				.map(() => createNodeWithISP('Amazon AWS', true, time));

			mockHttpClient.analyzeTopTier.mockResolvedValue(
				ok({ top_tier: ['Amazon AWS'], top_tier_size: 1 })
			);
			mockHttpClient.analyzeBlockingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 1,
					example_set: ['Amazon AWS'],
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeSplittingSets.mockResolvedValue(
				ok({
					min_size: 1,
					total_sets: 0,
					example_set: [],
					has_split: false,
					execution_time_ms: 100
				})
			);
			mockHttpClient.analyzeQuorums.mockResolvedValue(
				ok({
					quorum_intersection: true,
					min_size: 1,
					total_quorums: 1,
					example_quorum: ['Amazon AWS'],
					execution_time_ms: 100
				})
			);

			const result = await adapter.analyze(nodes, []);

			expect(result.isOk()).toBe(true);

			// Verify ISP level was called with aggregated nodes
			const topTierCalls = mockHttpClient.analyzeTopTier.mock.calls;
			const ispLevelCall = topTierCalls.find(
				(call) =>
					call[0].nodes.length === 1 &&
					call[0].nodes[0].publicKey === 'Amazon AWS'
			);
			expect(ispLevelCall).toBeDefined();
		});
	});
});

describe('PythonFbasAdapter symmetric top tier', () => {
	let adapter: PythonFbasAdapter;
	let mockHttpClient: jest.Mocked<IPythonFbasHttpClient>;
	const time = new Date();

	/**
	 * Wires the mock so every analysis call succeeds, with the node-level top
	 * tier reported as `topTier`. Only the symmetric flag is under test here.
	 */
	function stubHttpClient(topTier: string[]) {
		mockHttpClient.analyzeTopTier.mockResolvedValue(
			ok({ top_tier: topTier, top_tier_size: topTier.length })
		);
		mockHttpClient.analyzeBlockingSets.mockResolvedValue(ok({ min_size: 2 }));
		mockHttpClient.analyzeSplittingSets.mockResolvedValue(ok({ min_size: 3 }));
		mockHttpClient.analyzeQuorums.mockResolvedValue(
			ok({ quorum_intersection: true })
		);
	}

	function nodeWith(
		publicKey: string,
		quorumSetData: {
			threshold: number;
			validators: string[];
			innerQuorumSets: any[];
		}
	): Node {
		const node = createNodeWithQuorumSet(quorumSetData, true, time);
		// createDummyNode generates a random key; pin it so the top tier
		// returned by the stub actually resolves to this node.
		Object.defineProperty(node, 'publicKey', {
			value: { value: publicKey },
			configurable: true
		});
		return node;
	}

	beforeEach(() => {
		mockHttpClient = {
			analyzeTopTier: jest.fn(),
			analyzeBlockingSets: jest.fn(),
			analyzeSplittingSets: jest.fn(),
			analyzeQuorums: jest.fn(),
			healthCheck: jest.fn()
		};
		adapter = new PythonFbasAdapter(
			mockHttpClient,
			new FbasAggregator(),
			new FbasFilteredAnalyzer()
		);
	});

	it('reports a symmetric top tier when every member declares the same quorum set', async () => {
		const quorumSet = {
			threshold: 2,
			validators: ['A', 'B', 'C'],
			innerQuorumSets: []
		};
		const nodes = [
			nodeWith('A', quorumSet),
			nodeWith('B', quorumSet),
			nodeWith('C', quorumSet)
		];
		stubHttpClient(['A', 'B', 'C']);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.hasSymmetricTopTier).toBe(true);
	});

	it('ignores validator ordering when comparing quorum sets', async () => {
		const nodes = [
			nodeWith('A', {
				threshold: 2,
				validators: ['A', 'B', 'C'],
				innerQuorumSets: []
			}),
			nodeWith('B', {
				threshold: 2,
				validators: ['C', 'A', 'B'],
				innerQuorumSets: []
			})
		];
		stubHttpClient(['A', 'B']);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.hasSymmetricTopTier).toBe(true);
	});

	it('reports an asymmetric top tier when a member declares a different threshold', async () => {
		const nodes = [
			nodeWith('A', {
				threshold: 2,
				validators: ['A', 'B', 'C'],
				innerQuorumSets: []
			}),
			nodeWith('B', {
				threshold: 3,
				validators: ['A', 'B', 'C'],
				innerQuorumSets: []
			})
		];
		stubHttpClient(['A', 'B']);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.hasSymmetricTopTier).toBe(false);
	});

	it('does not call an empty top tier symmetric', async () => {
		const nodes = [
			nodeWith('A', { threshold: 1, validators: ['A'], innerQuorumSets: [] })
		];
		stubHttpClient([]);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.hasSymmetricTopTier).toBe(false);
	});

	it('does not call a top tier symmetric when a member cannot be inspected', async () => {
		const nodes = [
			nodeWith('A', {
				threshold: 2,
				validators: ['A', 'B'],
				innerQuorumSets: []
			})
		];
		// The service reports a member Radar holds no quorum set for.
		stubHttpClient(['A', 'UNKNOWN']);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.hasSymmetricTopTier).toBe(false);
	});
});

describe('PythonFbasAdapter network-wide organization splitting set', () => {
	let mockHttpClient: jest.Mocked<IPythonFbasHttpClient>;
	let adapter: PythonFbasAdapter;
	const time = new Date();

	function stub(topTier: string[], splittingMinSizes: number[]) {
		mockHttpClient.analyzeTopTier.mockResolvedValue(
			ok({ top_tier: topTier, top_tier_size: topTier.length })
		);
		mockHttpClient.analyzeBlockingSets.mockResolvedValue(ok({ min_size: 3 }));
		mockHttpClient.analyzeQuorums.mockResolvedValue(
			ok({ quorum_intersection: true })
		);
		//each call in order: the levels, then the network-wide recomputation
		let call = 0;
		mockHttpClient.analyzeSplittingSets.mockImplementation(async () => {
			const size = splittingMinSizes[Math.min(call, splittingMinSizes.length - 1)];
			call++;
			return ok({ min_size: size });
		});
	}

	beforeEach(() => {
		mockHttpClient = {
			analyzeTopTier: jest.fn(),
			analyzeBlockingSets: jest.fn(),
			analyzeSplittingSets: jest.fn(),
			analyzeQuorums: jest.fn(),
			healthCheck: jest.fn()
		};
		adapter = new PythonFbasAdapter(
			mockHttpClient,
			new FbasAggregator(),
			new FbasFilteredAnalyzer()
		);
	});

	/**
	 * Radar restricts its analysis to the transitive network quorum set, so its
	 * organization splitting set answered a narrower question than its label
	 * implied. Passing the wider validating set lets that figure see a validator
	 * being severed from the core, which is the discrepancy python-fbas reported.
	 */
	it('does not widen the figure when no wider node set is given', async () => {
		const nodes = [
			createNodeWithQuorumSet(
				{ threshold: 1, validators: ['A'], innerQuorumSets: [] },
				true,
				time
			)
		];
		stub([], [7]);

		const result = await adapter.analyze(nodes, []);

		expect(result.isOk()).toBe(true);
		if (result.isOk())
			expect(result.value.organization.splittingSetsMinSize).toBe(7);
	});

	it('leaves the rest of the scan intact when the wider analysis fails', async () => {
		const nodes = [
			createNodeWithQuorumSet(
				{ threshold: 1, validators: ['A'], innerQuorumSets: [] },
				true,
				time
			)
		];
		stub([], [7]);
		//the wider recomputation is the last splitting-set call
		mockHttpClient.analyzeSplittingSets
			.mockResolvedValueOnce(ok({ min_size: 7 }))
			.mockResolvedValueOnce(ok({ min_size: 7 }))
			.mockResolvedValueOnce(ok({ min_size: 7 }))
			.mockResolvedValue(err(new Error('service unavailable')));

		const result = await adapter.analyze(nodes, [], nodes);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			//the narrower answer survives rather than the level being lost
			expect(result.value.organization.blockingSetsMinSize).toBe(3);
		}
	});
});
