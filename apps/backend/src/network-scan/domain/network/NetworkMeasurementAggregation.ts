import { Column } from 'typeorm';
import { MeasurementAggregation } from '../measurement-aggregation/MeasurementAggregation';

export abstract class NetworkMeasurementAggregation
	implements MeasurementAggregation
{
	@Column('date', { primary: true, name: 'time' })
	time: Date = new Date();

	//@deprecated
	@Column('int', { default: 0 })
	nrOfActiveWatchersSum = 0;

	@Column('int', { default: 0 })
	nrOfConnectableNodesSum = 0;

	@Column('int', { default: 0 })
	nrOfActiveValidatorsSum = 0; //validators that are validating

	@Column('int', { default: 0 })
	nrOfActiveFullValidatorsSum = 0;

	@Column('int', { default: 0 })
	nrOfActiveOrganizationsSum = 0;

	@Column('int', { default: 0 })
	transitiveQuorumSetSizeSum = 0;

	@Column('smallint', { default: 0 })
	hasQuorumIntersectionCount = 0;

	@Column('smallint', { default: 0 })
	hasSymmetricTopTierCount = 0;

	@Column('smallint', { default: 0 })
	hasTransitiveQuorumSetCount = 0;

	@Column('smallint', { default: 0 })
	topTierMin = 0;

	@Column('smallint', { default: 0 })
	topTierMax = 0;

	@Column('int', { default: 0 })
	topTierSum = 0;

	@Column('smallint', { default: 0 })
	topTierOrgsMin = 0;

	@Column('smallint', { default: 0 })
	topTierOrgsMax = 0;

	@Column('int', { default: 0 })
	topTierOrgsSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetFilteredMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetFilteredMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetFilteredSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetOrgsMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetOrgsMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetOrgsSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetOrgsFilteredMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetOrgsFilteredMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetOrgsFilteredSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountryMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountryMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetCountrySum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountryFilteredMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetCountryFilteredMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetCountryFilteredSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetISPSum = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPFilteredMin = 0;

	@Column('smallint', { default: 0 })
	minBlockingSetISPFilteredMax = 0;

	@Column('int', { default: 0 })
	minBlockingSetISPFilteredSum = 0;

	//The grouped splitting-set aggregates below are nullable: null means no such
	//set exists at that grouping, which is the best possible answer, not zero.
	//minSplittingSetMin/Max/Sum stay non-null - minSplittingSetSize itself is.
	@Column('smallint', { default: 0 })
	minSplittingSetMin = 0;

	@Column('smallint', { default: 0 })
	minSplittingSetMax = 0;

	@Column('int', { default: 0 })
	minSplittingSetSum = 0;

	@Column('smallint', { nullable: true })
	minSplittingSetOrgsMin: number | null = null;

	@Column('smallint', { nullable: true })
	minSplittingSetOrgsMax: number | null = null;

	@Column('int', { nullable: true })
	minSplittingSetOrgsSum: number | null = null;

	@Column('smallint', { nullable: true })
	minSplittingSetCountryMin: number | null = null;

	@Column('smallint', { nullable: true })
	minSplittingSetCountryMax: number | null = null;

	@Column('int', { nullable: true })
	minSplittingSetCountrySum: number | null = null;

	@Column('smallint', { nullable: true })
	minSplittingSetISPMin: number | null = null;

	@Column('smallint', { nullable: true })
	minSplittingSetISPMax: number | null = null;

	@Column('int', { nullable: true })
	minSplittingSetISPSum: number | null = null;

	@Column('smallint', { default: 0 })
	crawlCount = 0;
}
