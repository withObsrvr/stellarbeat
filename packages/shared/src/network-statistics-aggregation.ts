export default class NetworkStatisticsAggregation {
	time: Date = new Date();
	nrOfActiveWatchersSum = 0;
	nrOfActiveValidatorsSum = 0;
	nrOfActiveFullValidatorsSum = 0;
	nrOfActiveOrganizationsSum = 0;
	transitiveQuorumSetSizeSum = 0;
	hasQuorumIntersectionCount = 0;
	hasTransitiveQuorumSetCount = 0;
	topTierMin = 0;
	topTierMax = 0;
	topTierSum = 0;
	topTierOrgsMin = 0;
	topTierOrgsMax = 0;
	topTierOrgsSum = 0;
	minBlockingSetMin = 0;
	minBlockingSetMax = 0;
	minBlockingSetSum = 0;
	minBlockingSetOrgsMin = 0;
	minBlockingSetOrgsMax = 0;
	minBlockingSetOrgsSum = 0;
	minBlockingCountryOrgsMin = 0;
	minBlockingSetCountryMax = 0;
	minBlockingSetCountrySum = 0;
	minBlockingSetISPMin = 0;
	minBlockingSetISPMax = 0;
	minBlockingSetISPSum = 0;
	minBlockingSetFilteredMin = 0;
	minBlockingSetFilteredMax = 0;
	minBlockingSetFilteredSum = 0;
	minBlockingSetOrgsFilteredMin = 0;
	minBlockingSetOrgsFilteredMax = 0;
	minBlockingSetOrgsFilteredSum = 0;
	minBlockingSetCountryFilteredMin = 0;
	minBlockingSetCountryFilteredMax = 0;
	minBlockingSetCountryFilteredSum = 0;
	minBlockingSetISPFilteredMin = 0;
	minBlockingSetISPFilteredMax = 0;
	minBlockingSetISPFilteredSum = 0;
	minSplittingSetMin = 0;
	minSplittingSetMax = 0;
	minSplittingSetSum = 0;
	minSplittingSetOrgsMin = 0;
	minSplittingSetOrgsMax = 0;
	minSplittingSetOrgsSum = 0;
	minSplittingSetCountryMin = 0;
	minSplittingSetCountryMax = 0;
	minSplittingSetCountrySum = 0;
	minSplittingSetISPMin = 0;
	minSplittingSetISPMax = 0;
	minSplittingSetISPSum = 0;
	hasSymmetricTopTierCount = 0;
	crawlCount = 0;

	get nrOfActiveWatchersAverage() {
		return +(this.nrOfActiveWatchersSum / this.crawlCount).toFixed(2);
	}

	get nrOfActiveValidatorsAverage() {
		return +(this.nrOfActiveValidatorsSum / this.crawlCount).toFixed(2);
	}

	get nrOfActiveFullValidatorsAverage() {
		return +(this.nrOfActiveFullValidatorsSum / this.crawlCount).toFixed(2);
	}

	get nrOfActiveOrganizationsAverage() {
		return +(this.nrOfActiveOrganizationsSum / this.crawlCount).toFixed(2);
	}

	get transitiveQuorumSetSizeAverage() {
		return +(this.transitiveQuorumSetSizeSum / this.crawlCount).toFixed(2);
	}

	get hasTransitiveQuorumSetAverage() {
		return +(this.hasTransitiveQuorumSetCount / this.crawlCount).toFixed(2);
	}

	get hasQuorumIntersectionAverage() {
		return +(this.hasQuorumIntersectionCount / this.crawlCount).toFixed(2);
	}

	get hasSymmetricTopTierAverage() {
		return +(this.hasSymmetricTopTierCount / this.crawlCount).toFixed(2);
	}

	get topTierAverage() {
		return this.getAverage(this.topTierSum);
	}

	get topTierOrgsAverage() {
		return this.getAverage(this.topTierOrgsSum);
	}

	get minBlockingSetAverage() {
		return this.getAverage(this.minBlockingSetSum);
	}

	get minBlockingSetFilteredAverage() {
		return this.getAverage(this.minBlockingSetFilteredSum);
	}

	get minBlockingSetOrgsAverage() {
		return this.getAverage(this.minBlockingSetOrgsSum);
	}

	get minBlockingSetOrgsFilteredAverage() {
		return this.getAverage(this.minBlockingSetOrgsFilteredSum);
	}

	get minBlockingSetCountryAverage() {
		return this.getAverage(this.minBlockingSetCountrySum);
	}

	get minBlockingSetCountryFilteredAverage() {
		return this.getAverage(this.minBlockingSetCountryFilteredSum);
	}

	get minBlockingSetISPAverage() {
		return this.getAverage(this.minBlockingSetISPSum);
	}

	get minBlockingSetISPFilteredAverage() {
		return this.getAverage(this.minBlockingSetISPFilteredSum);
	}

	get minSplittingSetAverage() {
		return this.getAverage(this.minSplittingSetSum);
	}

	get minSplittingSetOrgsAverage() {
		return this.getAverage(this.minSplittingSetOrgsSum);
	}

	get minSplittingSetCountryAverage() {
		return this.getAverage(this.minSplittingSetCountrySum);
	}

	get minSplittingSetISPAverage() {
		return this.getAverage(this.minSplittingSetISPSum);
	}

	protected getAverage(value: number) {
		if (this.crawlCount === 0) return 0;

		return +(value / this.crawlCount).toFixed(2);
	}

	static fromJSON(
		networkStats: string | Record<string, unknown>
	): NetworkStatisticsAggregation {
		let networkStatsObject: Record<string, unknown>;
		if (typeof networkStats === 'string') {
			networkStatsObject = JSON.parse(networkStats);
		} else networkStatsObject = networkStats;

		const newNetworkStatsAggregation = new NetworkStatisticsAggregation();
		for (const [key, value] of Object.entries(networkStatsObject)) {
			//@ts-ignore
			newNetworkStatsAggregation[key] = value;
		}

		return newNetworkStatsAggregation;
	}
}
