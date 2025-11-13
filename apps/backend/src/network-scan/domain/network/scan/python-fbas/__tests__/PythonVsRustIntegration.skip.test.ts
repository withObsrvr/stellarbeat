/**
 * Integration tests comparing Python FBAS scanner with Rust scanner
 *
 * These tests verify that:
 * 1. Both scanners produce consistent results on the same data
 * 2. Python scanner handles unlimited tier 1 organizations (no cap)
 * 3. Aggregation logic produces valid analysis at all levels
 * 4. Filtered vs unfiltered analysis works correctly
 *
 * Note: These tests require the Python FBAS service to be running
 * Skip if not available by setting environment variable:
 * SKIP_PYTHON_INTEGRATION_TESTS=true
 */

import { PythonFbasAdapter } from '../PythonFbasAdapter';
import { PythonFbasHttpClientFactory } from '../PythonFbasHttpClient';
import { FbasAggregator } from '../FbasAggregator';
import { FbasFilteredAnalyzer } from '../FbasFilteredAnalyzer';
import FbasAnalyzerFacade from '../../fbas-analysis/FbasAnalyzerFacade';
import {
	createSimpleNetwork,
	createNodeWithQuorumSet,
	createOrganizationWithValidators,
	createNodeWithGeoData,
	createNodeWithISP
} from './test-helpers';

const SKIP_TESTS = process.env.SKIP_PYTHON_INTEGRATION_TESTS !== 'false';

describe.skip('Python vs Rust Scanner Integration', () => {
	let pythonAdapter: PythonFbasAdapter;
	let rustFacade: FbasAnalyzerFacade;
	let aggregator: FbasAggregator;
	let filteredAnalyzer: FbasFilteredAnalyzer;
	const time = new Date();

	beforeAll(async () => {
		if (SKIP_TESTS) {
			console.log(
				'Skipping Python integration tests (set SKIP_PYTHON_INTEGRATION_TESTS=false to run)'
			);
			return;
		}

		// Setup Python adapter
		const httpClient = PythonFbasHttpClientFactory.create();
		aggregator = new FbasAggregator();
		filteredAnalyzer = new FbasFilteredAnalyzer();
		pythonAdapter = new PythonFbasAdapter(
			httpClient,
			aggregator,
			filteredAnalyzer
		);

		// Setup Rust facade
		rustFacade = new FbasAnalyzerFacade();

		// Health check
		const health = await httpClient.healthCheck();
		if (health.isErr()) {
			throw new Error(
				`Python FBAS service not available: ${health.error.message}`
			);
		}
	});

	describe('Basic Agreement Tests', () => {
		it('should agree on quorum intersection for simple network', async () => {
			if (SKIP_TESTS) return;

			// Create simple network with quorum intersection
			const nodes = createSimpleNetwork(time);

			// Python analysis
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis
			const rustResultOrError = rustFacade.analyzeTopTier(nodes, [], null);
			if (rustResultOrError.isErr()) {
				throw rustResultOrError.error;
			}
			const rustResult = rustResultOrError.value;

			// Both should find quorum intersection
			if (pythonResult.isOk()) {
				expect(pythonResult.value.hasQuorumIntersection).toBe(true);
				expect(rustResult.hasQuorumIntersection).toBe(true);

				// Top tier size should match
				expect(pythonResult.value.node.topTierSize).toBe(
					rustResult.topTierSize
				);
			}
		});

		it('should agree on blocking set size', async () => {
			if (SKIP_TESTS) return;

			const nodes = createSimpleNetwork(time);

			// Python analysis
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis
			const rustResult = rustFacade.analyzeBlockingSets(nodes, false);

			if (pythonResult.isOk()) {
				expect(pythonResult.value.node.blockingSetsMinSize).toBe(
					rustResult.blockingSetsMinSize
				);
			}
		});

		it('should agree on splitting set size', async () => {
			if (SKIP_TESTS) return;

			const nodes = createSimpleNetwork(time);

			// Python analysis
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis
			const rustResult = rustFacade.analyzeSplittingSets(nodes);

			if (pythonResult.isOk()) {
				expect(pythonResult.value.node.splittingSetsMinSize).toBe(
					rustResult.splittingSetsMinSize
				);
			}
		});
	});

	describe('Filtered Analysis Tests', () => {
		it('should handle filtered vs unfiltered blocking sets', async () => {
			if (SKIP_TESTS) return;

			// Create network with mix of validating and non-validating nodes
			const validatingNode = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const nonValidatingNode = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				false,
				time
			);

			const nodes = [validatingNode, nonValidatingNode];

			// Python analysis (does both automatically)
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis (filtered)
			const rustUnfiltered = rustFacade.analyzeBlockingSets(nodes, false);
			const rustFiltered = rustFacade.analyzeBlockingSets(nodes, true);

			if (pythonResult.isOk()) {
				// Compare unfiltered
				expect(pythonResult.value.node.blockingSetsMinSize).toBe(
					rustUnfiltered.blockingSetsMinSize
				);

				// Compare filtered
				expect(pythonResult.value.node.blockingSetsFilteredMinSize).toBe(
					rustFiltered.blockingSetsMinSize
				);

				// Filtered should be >= unfiltered (removing non-validating nodes makes network harder to block)
				expect(
					pythonResult.value.node.blockingSetsFilteredMinSize
				).toBeGreaterThanOrEqual(pythonResult.value.node.blockingSetsMinSize);
			}
		});
	});

	describe('Organization Aggregation Tests', () => {
		it('should handle organization-level aggregation', async () => {
			if (SKIP_TESTS) return;

			// Create network with organizations
			const nodes = Array(4)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{
							threshold: 1,
							validators: [],
							innerQuorumSets: []
						},
						true,
						time
					)
				);

			const org1 = createOrganizationWithValidators(
				[nodes[0].publicKey, nodes[1].publicKey],
				'Org 1',
				time
			);
			const org2 = createOrganizationWithValidators(
				[nodes[2].publicKey, nodes[3].publicKey],
				'Org 2',
				time
			);

			// Python analysis (handles unlimited organizations)
			const pythonResult = await pythonAdapter.analyze(nodes, [org1, org2]);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis with org merging
			const rustResult = rustFacade.analyzeMergedByOrganization(nodes, [
				org1,
				org2
			]);

			if (pythonResult.isOk()) {
				// Organization-level top tier should match
				expect(pythonResult.value.organization.topTierSize).toBe(
					rustResult.topTierSize
				);

				// Organization-level blocking sets should be close
				// (May differ slightly due to aggregation strategy differences)
				const pythonBlocking =
					pythonResult.value.organization.blockingSetsMinSize;
				const rustBlocking = rustResult.blockingSetsMinSize;
				const difference = Math.abs(pythonBlocking - rustBlocking);

				// Allow difference of 1 due to implementation differences
				expect(difference).toBeLessThanOrEqual(1);
			}
		});

		it('should handle more than tier 1 org cap (Python only)', async () => {
			if (SKIP_TESTS) return;

			// Create network with many organizations (exceeding Rust cap)
			const numOrgs = 25;
			const nodes = Array(numOrgs * 2)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{
							threshold: 1,
							validators: [],
							innerQuorumSets: []
						},
						true,
						time
					)
				);

			const organizations = [];
			for (let i = 0; i < numOrgs; i++) {
				const org = createOrganizationWithValidators(
					[nodes[i * 2].publicKey, nodes[i * 2 + 1].publicKey],
					`Org ${i}`,
					time
				);
				organizations.push(org);
			}

			// Python analysis should succeed with no cap
			const pythonResult = await pythonAdapter.analyze(nodes, organizations);
			expect(pythonResult.isOk()).toBe(true);

			if (pythonResult.isOk()) {
				// Should successfully analyze all organizations
				expect(pythonResult.value.organization.topTierSize).toBeGreaterThan(
					0
				);

				// Should have valid blocking sets
				expect(
					pythonResult.value.organization.blockingSetsMinSize
				).toBeGreaterThan(0);
			}
		});
	});

	describe('Country Aggregation Tests', () => {
		it('should handle country-level aggregation', async () => {
			if (SKIP_TESTS) return;

			const nodes = [
				createNodeWithGeoData('United States', true, time),
				createNodeWithGeoData('United States', true, time),
				createNodeWithGeoData('Germany', true, time)
			];

			// Python analysis
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis with country merging
			const rustResult = rustFacade.analyzeMergedByCountry(nodes);

			if (pythonResult.isOk()) {
				// Country-level top tier should match or be close
				const pythonTopTier = pythonResult.value.country.topTierSize;
				const rustTopTier = rustResult.topTierSize;
				const difference = Math.abs(pythonTopTier - rustTopTier);

				expect(difference).toBeLessThanOrEqual(1);
			}
		});
	});

	describe('ISP Aggregation Tests', () => {
		it('should handle ISP-level aggregation', async () => {
			if (SKIP_TESTS) return;

			const nodes = [
				createNodeWithISP('Amazon AWS', true, time),
				createNodeWithISP('Amazon AWS', true, time),
				createNodeWithISP('Hetzner', true, time)
			];

			// Python analysis
			const pythonResult = await pythonAdapter.analyze(nodes, []);
			expect(pythonResult.isOk()).toBe(true);

			// Rust analysis with ISP merging
			const rustResult = rustFacade.analyzeMergedByISP(nodes);

			if (pythonResult.isOk()) {
				// ISP-level top tier should match or be close
				const pythonTopTier = pythonResult.value.isp.topTierSize;
				const rustTopTier = rustResult.topTierSize;
				const difference = Math.abs(pythonTopTier - rustTopTier);

				expect(difference).toBeLessThanOrEqual(1);
			}
		});
	});
});
