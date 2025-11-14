import { FbasAggregator, AggregationType } from '../FbasAggregator';
import {
	createNodeWithQuorumSet,
	createOrganizationWithValidators,
	createNodeWithGeoData,
	createNodeWithISP
} from '../__fixtures__/test-helpers';
import { QuorumSet } from 'shared';

describe('FbasAggregator', () => {
	let aggregator: FbasAggregator;
	const time = new Date();

	beforeEach(() => {
		aggregator = new FbasAggregator();
	});

	describe('aggregateByOrganization', () => {
		it('should group validators by organization', () => {
			// Create nodes from same organization
			const node1 = createNodeWithQuorumSet(
				{
					threshold: 2,
					validators: ['VALIDATOR_A', 'VALIDATOR_B'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const node2 = createNodeWithQuorumSet(
				{
					threshold: 2,
					validators: ['VALIDATOR_A', 'VALIDATOR_C'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const org = createOrganizationWithValidators(
				[node1.publicKey, node2.publicKey],
				'Test Org',
				time
			);

			const aggregated = aggregator.aggregateByOrganization(
				[node1, node2],
				[org]
			);

			expect(aggregated).toHaveLength(1);
			expect(aggregated[0].publicKey).toBe(org.organizationId.value);
			expect(aggregated[0].name).toBe('Test Org');
			expect(aggregated[0]._originalValidators).toHaveLength(2);
			expect(aggregated[0]._aggregationType).toBe('organization');
		});

		it('should merge quorum sets from same organization', () => {
			const node1 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['EXT_A'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const node2 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['EXT_B'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const org = createOrganizationWithValidators(
				[node1.publicKey, node2.publicKey],
				'Test Org',
				time
			);

			const aggregated = aggregator.aggregateByOrganization(
				[node1, node2],
				[org]
			);

			expect(aggregated[0].quorumSet).not.toBeNull();
			expect(aggregated[0].quorumSet!.threshold).toBeGreaterThan(0);
			// Should contain external validators
			expect(aggregated[0].quorumSet!.validators).toContain('EXT_A');
			expect(aggregated[0].quorumSet!.validators).toContain('EXT_B');
		});

		it('should handle multiple organizations', () => {
			const node1 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const node2 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const org1 = createOrganizationWithValidators(
				[node1.publicKey],
				'Org 1',
				time
			);
			const org2 = createOrganizationWithValidators(
				[node2.publicKey],
				'Org 2',
				time
			);

			const aggregated = aggregator.aggregateByOrganization(
				[node1, node2],
				[org1, org2]
			);

			expect(aggregated).toHaveLength(2);
			expect(aggregated.map((n) => n.publicKey)).toContain(
				org1.organizationId.value
			);
			expect(aggregated.map((n) => n.publicKey)).toContain(
				org2.organizationId.value
			);
		});

		it('should skip nodes without organization', () => {
			const node = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const aggregated = aggregator.aggregateByOrganization([node], []);

			expect(aggregated).toHaveLength(0);
		});

		it('should skip organizations without valid quorum sets', () => {
			const node1 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			// Create node without quorum set by demoting it
			const node2 = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);
			node2.demoteToWatcher(time);

			const org = createOrganizationWithValidators(
				[node1.publicKey, node2.publicKey],
				'Test Org',
				time
			);

			const aggregated = aggregator.aggregateByOrganization(
				[node1, node2],
				[org]
			);

			// Should still have the org because node1 has a quorum set
			expect(aggregated).toHaveLength(1);
		});
	});

	describe('aggregateByCountry', () => {
		it('should group validators by country', () => {
			const node1 = createNodeWithGeoData('United States', true, time);
			const node2 = createNodeWithGeoData('United States', true, time);

			const aggregated = aggregator.aggregateByCountry([node1, node2]);

			expect(aggregated).toHaveLength(1);
			expect(aggregated[0].publicKey).toBe('United States');
			expect(aggregated[0].geoData?.countryName).toBe('United States');
			expect(aggregated[0]._originalValidators).toHaveLength(2);
			expect(aggregated[0]._aggregationType).toBe('country');
		});

		it('should handle multiple countries', () => {
			const node1 = createNodeWithGeoData('United States', true, time);
			const node2 = createNodeWithGeoData('Germany', true, time);

			const aggregated = aggregator.aggregateByCountry([node1, node2]);

			expect(aggregated).toHaveLength(2);
			expect(aggregated.map((n) => n.publicKey)).toContain('United States');
			expect(aggregated.map((n) => n.publicKey)).toContain('Germany');
		});

		it('should handle nodes without country as "Unknown"', () => {
			const node = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const aggregated = aggregator.aggregateByCountry([node]);

			expect(aggregated).toHaveLength(1);
			expect(aggregated[0].publicKey).toBe('Unknown');
		});
	});

	describe('aggregateByISP', () => {
		it('should group validators by ISP', () => {
			const node1 = createNodeWithISP('Amazon AWS', true, time);
			const node2 = createNodeWithISP('Amazon AWS', true, time);

			const aggregated = aggregator.aggregateByISP([node1, node2]);

			expect(aggregated).toHaveLength(1);
			expect(aggregated[0].publicKey).toBe('Amazon AWS');
			expect(aggregated[0].isp).toBe('Amazon AWS');
			expect(aggregated[0]._originalValidators).toHaveLength(2);
			expect(aggregated[0]._aggregationType).toBe('isp');
		});

		it('should handle multiple ISPs', () => {
			const node1 = createNodeWithISP('Amazon AWS', true, time);
			const node2 = createNodeWithISP('Hetzner', true, time);

			const aggregated = aggregator.aggregateByISP([node1, node2]);

			expect(aggregated).toHaveLength(2);
			expect(aggregated.map((n) => n.publicKey)).toContain('Amazon AWS');
			expect(aggregated.map((n) => n.publicKey)).toContain('Hetzner');
		});

		it('should handle nodes without ISP as "Unknown"', () => {
			const node = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: [],
					innerQuorumSets: []
				},
				true,
				time
			);

			const aggregated = aggregator.aggregateByISP([node]);

			expect(aggregated).toHaveLength(1);
			expect(aggregated[0].publicKey).toBe('Unknown');
		});
	});

	describe('validateAggregatedNodes', () => {
		it('should validate correct nodes', () => {
			const node = createNodeWithQuorumSet(
				{
					threshold: 1,
					validators: ['A'],
					innerQuorumSets: []
				},
				true,
				time
			);

			const aggregated = aggregator.aggregateByCountry([node]);
			const validation = aggregator.validateAggregatedNodes(aggregated);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should detect missing quorum set', () => {
			const invalidNode = {
				publicKey: 'test',
				name: 'test',
				quorumSet: null,
				geoData: null,
				isp: null,
				_originalValidators: ['A'],
				_aggregationType: 'organization' as const
			};

			const validation = aggregator.validateAggregatedNodes([invalidNode]);

			expect(validation.valid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
		});

		it('should detect invalid threshold', () => {
			const invalidNode = {
				publicKey: 'test',
				name: 'test',
				quorumSet: new QuorumSet(0, ['A'], []),
				geoData: null,
				isp: null,
				_originalValidators: ['A'],
				_aggregationType: 'organization' as const
			};

			const validation = aggregator.validateAggregatedNodes([invalidNode]);

			expect(validation.valid).toBe(false);
			expect(validation.errors.some((e) => e.includes('threshold'))).toBe(true);
		});
	});

	describe('getAggregationSummary', () => {
		it('should calculate aggregation metrics', () => {
			const nodes = Array(100)
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

			const aggregated = aggregator.aggregateByCountry(nodes);
			const summary = aggregator.getAggregationSummary(
				nodes,
				aggregated,
				AggregationType.COUNTRY
			);

			expect(summary.originalCount).toBe(100);
			expect(summary.aggregatedCount).toBe(aggregated.length);
			expect(summary.reductionPercentage).toBeGreaterThan(0);
			expect(summary.averageGroupSize).toBeGreaterThan(1);
			expect(summary.type).toBe(AggregationType.COUNTRY);
		});
	});
});
