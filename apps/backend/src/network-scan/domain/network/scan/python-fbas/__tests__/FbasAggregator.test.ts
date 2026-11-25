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
			// External validators (not mapped to organizations) are filtered out
			// Only the organization itself should be in the validators list
			expect(aggregated[0].quorumSet!.validators).toContain(
				org.organizationId.value
			);
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
			// Use createNodeWithGeoData which properly sets geoData
			const node = createNodeWithGeoData('TestCountry', true, time);

			const aggregated = aggregator.aggregateByCountry([node]);
			// After fix: quorum set includes only the country itself (self-reference)
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

describe('FbasAggregator threshold clamping', () => {
	const aggregator = new FbasAggregator();
	const time = new Date();

	/**
	 * Reproduces the staging failure behind the "safety threshold of 0
	 * countries" report: geo data lookups timed out for every node, so country
	 * aggregation collapsed all of them into a single "Unknown" group. The
	 * merged quorum set averaged the source thresholds (7) against a single
	 * remaining validator, which can never be satisfied -- so no quorum exists,
	 * python-fbas finds no splitting set, and Radar renders the missing answer
	 * as a threshold of 0.
	 */
	it('never requires more validators than the aggregation produced', () => {
		const nodes = Array(29)
			.fill(null)
			.map(() =>
				createNodeWithQuorumSet(
					{ threshold: 7, validators: [], innerQuorumSets: [] },
					true,
					time
				)
			);

		const aggregated = aggregator.aggregateByCountry(nodes);

		expect(aggregated).toHaveLength(1);
		expect(aggregated[0].publicKey).toBe('Unknown');

		const quorumSet = aggregated[0].quorumSet;
		expect(quorumSet).not.toBeNull();
		expect(quorumSet!.threshold).toBeLessThanOrEqual(
			quorumSet!.validators.length
		);
		expect(quorumSet!.threshold).toBeGreaterThanOrEqual(1);
	});

	it('leaves a satisfiable threshold untouched', () => {
		const us1 = createNodeWithGeoData('United States', true, time);
		const us2 = createNodeWithGeoData('United States', true, time);
		const de = createNodeWithGeoData('Germany', true, time);

		const aggregated = aggregator.aggregateByCountry([us1, us2, de]);

		aggregated.forEach((node) => {
			expect(node.quorumSet).not.toBeNull();
			expect(node.quorumSet!.threshold).toBeLessThanOrEqual(
				node.quorumSet!.validators.length
			);
		});
	});
});

/**
 * Aggregating by organization maps each trusted validator to its organization
 * and skips the ones that belong to none. When nothing survives that mapping,
 * the self-reference every group receives is all that is left, and the threshold
 * clamp makes it satisfiable -- a quorum of one, disjoint from every other
 * quorum, which drives the whole FBAS to "no quorum intersection" and every
 * splitting set to zero.
 */
describe('FbasAggregator withoutSelfTrustingGroups', () => {
	const aggregator = new FbasAggregator();
	const time = new Date();

	function core() {
		const coreA = createNodeWithQuorumSet(
			{ threshold: 2, validators: [], innerQuorumSets: [] },
			true,
			time
		);
		const coreB = createNodeWithQuorumSet(
			{ threshold: 2, validators: [], innerQuorumSets: [] },
			true,
			time
		);
		//they trust each other, so neither collapses to itself
		const pair = [coreA.publicKey.value, coreB.publicKey.value];
		coreA.quorumSet!.quorumSet.validators = pair;
		coreB.quorumSet!.quorumSet.validators = pair;

		return {
			coreA,
			coreB,
			orgA: createOrganizationWithValidators([coreA.publicKey], 'Core A', time),
			orgB: createOrganizationWithValidators([coreB.publicKey], 'Core B', time)
		};
	}

	it('drops an organization whose trusted validators belong to no organization', () => {
		const { coreA, coreB, orgA, orgB } = core();
		//its validators do declare trust, but in keys no organization claims
		const outlier = createNodeWithQuorumSet(
			{
				threshold: 2,
				validators: ['UNAFFILIATED_X', 'UNAFFILIATED_Y'],
				innerQuorumSets: []
			},
			true,
			time
		);
		const orgOutlier = createOrganizationWithValidators(
			[outlier.publicKey],
			'Outlier',
			time
		);

		const aggregated = aggregator.aggregateByOrganization(
			[coreA, coreB, outlier],
			[orgA, orgB, orgOutlier]
		);
		//the artifact this guards against: aggregation produced it
		expect(aggregated.map((node) => node.name).sort()).toEqual([
			'Core A',
			'Core B',
			'Outlier'
		]);

		expect(
			aggregator
				.withoutSelfTrustingGroups(aggregated)
				.map((node) => node.name)
				.sort()
		).toEqual(['Core A', 'Core B']);
	});

	it('keeps an outlying organization that still depends on the core', () => {
		const { coreA, coreB, orgA, orgB } = core();
		const dependent = createNodeWithQuorumSet(
			{ threshold: 2, validators: [], innerQuorumSets: [] },
			true,
			time
		);
		dependent.quorumSet!.quorumSet.validators = [
			coreA.publicKey.value,
			dependent.publicKey.value
		];
		const orgDependent = createOrganizationWithValidators(
			[dependent.publicKey],
			'Dependent',
			time
		);

		const kept = aggregator.withoutSelfTrustingGroups(
			aggregator.aggregateByOrganization(
				[coreA, coreB, dependent],
				[orgA, orgB, orgDependent]
			)
		);

		expect(kept.map((node) => node.name).sort()).toEqual([
			'Core A',
			'Core B',
			'Dependent'
		]);
		expect(
			kept.find((node) => node.name === 'Dependent')!.quorumSet!.validators
		).toContain(orgA.organizationId.value);
	});

	it('leaves no group that is a quorum of one', () => {
		const { coreA, coreB, orgA, orgB } = core();
		const outlier = createNodeWithQuorumSet(
			{ threshold: 1, validators: ['UNAFFILIATED_X'], innerQuorumSets: [] },
			true,
			time
		);
		const orgOutlier = createOrganizationWithValidators(
			[outlier.publicKey],
			'Outlier',
			time
		);

		aggregator
			.withoutSelfTrustingGroups(
				aggregator.aggregateByOrganization(
					[coreA, coreB, outlier],
					[orgA, orgB, orgOutlier]
				)
			)
			.forEach((node) => {
				const selfOnly =
					node.quorumSet!.validators.length === 1 &&
					node.quorumSet!.validators[0] === node.publicKey;
				expect(selfOnly).toBe(false);
			});
	});

	it('leaves an aggregation with nothing to drop untouched', () => {
		const { coreA, coreB, orgA, orgB } = core();
		const aggregated = aggregator.aggregateByOrganization(
			[coreA, coreB],
			[orgA, orgB]
		);

		expect(aggregator.withoutSelfTrustingGroups(aggregated)).toEqual(
			aggregated
		);
	});
});
