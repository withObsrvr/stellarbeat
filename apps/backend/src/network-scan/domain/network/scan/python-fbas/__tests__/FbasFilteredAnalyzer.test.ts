import { FbasFilteredAnalyzer } from '../FbasFilteredAnalyzer';
import { FbasAggregator, AggregatedNode } from '../FbasAggregator';
import {
	createNodeWithQuorumSet,
	createOrganizationWithValidators,
	createNodeWithGeoData,
	createNodeWithISP
} from './test-helpers';

describe('FbasFilteredAnalyzer', () => {
	let analyzer: FbasFilteredAnalyzer;
	const time = new Date();

	beforeEach(() => {
		analyzer = new FbasFilteredAnalyzer();
	});

	describe('filterRegularNodes', () => {
		it('should separate all nodes from validating nodes', () => {
			const validatingNode = createNodeWithQuorumSet(
				{ threshold: 1, validators: ['A'], innerQuorumSets: [] },
				true,
				time
			);

			const nonValidatingNode = createNodeWithQuorumSet(
				{ threshold: 1, validators: ['B'], innerQuorumSets: [] },
				false,
				time
			);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [validatingNode, nonValidatingNode]
			});

			expect(result.allNodes).toHaveLength(2);
			expect(result.validatingNodes).toHaveLength(1);
			expect(result.validatingNodes[0]).toBe(validatingNode);
		});

		it('should handle all validating nodes', () => {
			const nodes = Array(5)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{ threshold: 1, validators: [], innerQuorumSets: [] },
						true,
						time
					)
				);

			const result = analyzer.prepareFilteredAnalysis({ nodes });

			expect(result.allNodes).toHaveLength(5);
			expect(result.validatingNodes).toHaveLength(5);
		});

		it('should handle no validating nodes', () => {
			const nodes = Array(3)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{ threshold: 1, validators: [], innerQuorumSets: [] },
						false,
						time
					)
				);

			const result = analyzer.prepareFilteredAnalysis({ nodes });

			expect(result.allNodes).toHaveLength(3);
			expect(result.validatingNodes).toHaveLength(0);
		});
	});

	describe('filterAggregatedNodes', () => {
		it('should filter aggregated nodes by validating members', () => {
			const validatingNode = createNodeWithQuorumSet(
				{ threshold: 1, validators: ['A'], innerQuorumSets: [] },
				true,
				time
			);

			const nonValidatingNode = createNodeWithQuorumSet(
				{ threshold: 1, validators: ['B'], innerQuorumSets: [] },
				false,
				time
			);

			const org = createOrganizationWithValidators(
				[validatingNode.publicKey, nonValidatingNode.publicKey],
				'Test Org',
				time
			);

			const aggregator = new FbasAggregator();
			const aggregatedNodes = aggregator.aggregateByOrganization(
				[validatingNode, nonValidatingNode],
				[org]
			);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [validatingNode, nonValidatingNode],
				aggregatedNodes
			});

			// Should include the org because it has at least one validating node
			expect(result.allNodes).toHaveLength(1);
			expect(result.validatingNodes).toHaveLength(1);
		});

		it('should exclude aggregated nodes with no validating members', () => {
			const validatingNode1 = createNodeWithQuorumSet(
				{ threshold: 1, validators: [], innerQuorumSets: [] },
				true,
				time
			);

			const nonValidatingNode1 = createNodeWithQuorumSet(
				{ threshold: 1, validators: [], innerQuorumSets: [] },
				false,
				time
			);

			const org1 = createOrganizationWithValidators(
				[validatingNode1.publicKey],
				'Org 1',
				time
			);
			const org2 = createOrganizationWithValidators(
				[nonValidatingNode1.publicKey],
				'Org 2',
				time
			);

			const aggregator = new FbasAggregator();
			const aggregatedNodes = aggregator.aggregateByOrganization(
				[validatingNode1, nonValidatingNode1],
				[org1, org2]
			);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [validatingNode1, nonValidatingNode1],
				aggregatedNodes
			});

			expect(result.allNodes).toHaveLength(2); // Both orgs
			expect(result.validatingNodes).toHaveLength(1); // Only org1
			expect(result.validatingNodes[0].publicKey).toBe(org1.organizationId.value);
		});

		it('should handle country aggregation', () => {
			const validatingNode = createNodeWithGeoData('United States', true, time);

			const aggregator = new FbasAggregator();
			const aggregatedNodes = aggregator.aggregateByCountry([validatingNode]);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [validatingNode],
				aggregatedNodes
			});

			expect(result.allNodes).toHaveLength(1);
			expect(result.validatingNodes).toHaveLength(1);
			expect((result.validatingNodes[0] as AggregatedNode)._aggregationType).toBe('country');
		});

		it('should handle ISP aggregation', () => {
			const validatingNode = createNodeWithISP('Amazon AWS', true, time);

			const aggregator = new FbasAggregator();
			const aggregatedNodes = aggregator.aggregateByISP([validatingNode]);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [validatingNode],
				aggregatedNodes
			});

			expect(result.allNodes).toHaveLength(1);
			expect(result.validatingNodes).toHaveLength(1);
			expect((result.validatingNodes[0] as AggregatedNode)._aggregationType).toBe('isp');
		});
	});

	describe('validateFilteredResults', () => {
		it('should validate correct results', () => {
			const nodes = Array(5)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{ threshold: 1, validators: [], innerQuorumSets: [] },
						true,
						time
					)
				);

			const result = analyzer.prepareFilteredAnalysis({ nodes });
			const validation = analyzer.validateFilteredResults(result);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should detect empty all nodes set', () => {
			const result = {
				allNodes: [],
				validatingNodes: []
			};

			const validation = analyzer.validateFilteredResults(result);

			expect(validation.valid).toBe(false);
			expect(
				validation.errors.some((e) => e.includes('All nodes set is empty'))
			).toBe(true);
		});

		it('should detect empty validating nodes set', () => {
			const node = createNodeWithQuorumSet(
				{ threshold: 1, validators: [], innerQuorumSets: [] },
				true,
				time
			);

			const result = {
				allNodes: [node],
				validatingNodes: []
			};

			const validation = analyzer.validateFilteredResults(result);

			expect(validation.valid).toBe(false);
			expect(
				validation.errors.some((e) =>
					e.includes('Validating nodes set is empty')
				)
			).toBe(true);
		});
	});

	describe('getFilteredAnalysisSummary', () => {
		it('should calculate correct summary metrics', () => {
			const nodes = Array(10)
				.fill(null)
				.map((_, i) =>
					createNodeWithQuorumSet(
						{ threshold: 1, validators: [], innerQuorumSets: [] },
						i < 6, // First 6 are validating
						time
					)
				);

			const result = analyzer.prepareFilteredAnalysis({ nodes });
			const summary = analyzer.getFilteredAnalysisSummary(result);

			expect(summary.totalNodes).toBe(10);
			expect(summary.validatingNodes).toBe(6);
			expect(summary.filterPercentage).toBe(40); // 4 out of 10 filtered
			expect(summary.isAggregated).toBe(false);
		});

		it('should detect aggregated nodes in summary', () => {
			const node = createNodeWithQuorumSet(
				{ threshold: 1, validators: [], innerQuorumSets: [] },
				true,
				time
			);

			const org = createOrganizationWithValidators(
				[node.publicKey],
				'Test Org',
				time
			);

			const aggregator = new FbasAggregator();
			const aggregatedNodes = aggregator.aggregateByOrganization([node], [org]);

			const result = analyzer.prepareFilteredAnalysis({
				nodes: [node],
				aggregatedNodes
			});
			const summary = analyzer.getFilteredAnalysisSummary(result);

			expect(summary.isAggregated).toBe(true);
		});

		it('should handle 100% validating', () => {
			const nodes = Array(5)
				.fill(null)
				.map(() =>
					createNodeWithQuorumSet(
						{ threshold: 1, validators: [], innerQuorumSets: [] },
						true,
						time
					)
				);

			const result = analyzer.prepareFilteredAnalysis({ nodes });
			const summary = analyzer.getFilteredAnalysisSummary(result);

			expect(summary.filterPercentage).toBe(0); // Nothing filtered
		});
	});
});
