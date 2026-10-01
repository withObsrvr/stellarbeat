import { Entity, Column } from 'typeorm';
import { Measurement } from '../measurement/Measurement';

/**
 * See https://arxiv.org/pdf/2002.08101.pdf for more explanation of top tier, splitting & blocking sets
 */
@Entity()
export default class NetworkMeasurement implements Measurement {
	@Column('timestamptz', { primary: true })
	time: Date;

	//@deprecated
	@Column('smallint', { default: 0 })
	nrOfActiveWatchers = 0;

	@Column('smallint', { default: 0 })
	nrOfConnectableNodes = 0;

	@Column('smallint', { default: 0 })
	nrOfActiveValidators = 0; //validators that are validating

	@Column('smallint', { default: 0 })
	nrOfActiveFullValidators = 0;

	@Column('smallint', { default: 0 })
	nrOfActiveOrganizations = 0;

	@Column('smallint', { default: 0 })
	transitiveQuorumSetSize = 0;

	@Column('bool', { default: false })
	hasTransitiveQuorumSet = false;

	@Column('smallint', { default: 0 })
	topTierSize = 0;

	@Column('smallint', { default: 0 })
	topTierOrgsSize = 0;

	@Column('bool', { default: false })
	hasSymmetricTopTier = false;

	@Column('bool', { default: false })
	hasQuorumIntersection = false;

	//smallest blocking set size
	@Column('smallint', { default: 0 })
	minBlockingSetSize = 0;

	//smallest blocking set size without failing nodes
	@Column('smallint', { default: 0 })
	minBlockingSetFilteredSize = 0;

	//smallest blocking set size grouped by organizations
	@Column('smallint', { default: 0 })
	minBlockingSetOrgsSize = 0;

	//smallest blocking set size without failing nodes grouped by organizations
	@Column('smallint', { default: 0 })
	minBlockingSetOrgsFilteredSize = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountrySize = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountryFilteredSize = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPSize = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPFilteredSize = 0;

	//smallest splitting set size. Nullable for the same reason as the grouped
	//variants: no splitting set at all is not a threshold of zero.
	@Column('smallint', { nullable: true })
	minSplittingSetSize: number | null = null;

	//smallest splitting set size restricted to the top tier.
	//nullable on purpose: the legacy Rust facade does not compute this, and
	//storing 0 for "not computed" makes the UI report that no organizations at
	//all are needed to split the core -- the most alarming reading possible.
	@Column('smallint', { nullable: true })
	minSplittingSetTopTierSize: number | null = null;

	//smallest splitting set size grouped by organizations
	//nullable: python-fbas reporting no splitting set means safety cannot be
	//broken at this grouping, which must not be stored as 0
	@Column('smallint', { nullable: true })
	minSplittingSetOrgsSize: number | null = null;

	//smallest splitting set size grouped by organizations, restricted to the
	//top tier. Nullable for the same reason as minSplittingSetTopTierSize.
	@Column('smallint', { nullable: true })
	minSplittingSetOrgsTopTierSize: number | null = null;

	//smallest splitting set size grouped by organizations
	//nullable: python-fbas reporting no splitting set means safety cannot be
	//broken at this grouping, which must not be stored as 0
	@Column('smallint', { nullable: true })
	minSplittingSetCountrySize: number | null = null;

	//smallest splitting set size grouped by organizations
	//nullable: python-fbas reporting no splitting set means safety cannot be
	//broken at this grouping, which must not be stored as 0
	@Column('smallint', { nullable: true })
	minSplittingSetISPSize: number | null = null;

	constructor(time: Date) {
		this.time = time;
	}
}
