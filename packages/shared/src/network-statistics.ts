import {NetworkStatisticsV1} from "./dto/network-v1";
import PropertyMapper from "./PropertyMapper";

export default class NetworkStatistics {
	time: Date = new Date();
	nrOfActiveWatchers = 0;
	nrOfActiveValidators = 0; //validators that are validating
	nrOfActiveFullValidators = 0;
	nrOfActiveOrganizations = 0;
	transitiveQuorumSetSize = 0;
	hasTransitiveQuorumSet = false;
	hasQuorumIntersection?: boolean;
	minBlockingSetSize?: number;
	minBlockingSetFilteredSize = 0;
	minBlockingSetOrgsSize?: number;
	minBlockingSetOrgsFilteredSize?: number;
	minBlockingSetCountrySize?: number;
	minBlockingSetCountryFilteredSize?: number;
	minBlockingSetISPSize?: number;
	minBlockingSetISPFilteredSize?: number;
	minSplittingSetSize?: number;
	minSplittingSetOrgsSize?: number;
	minSplittingSetCountrySize?: number;
	minSplittingSetISPSize?: number;
	topTierSize?: number;
	topTierOrgsSize?: number;
	hasSymmetricTopTier = false;

	static fromJSON(
		networkStatsObject: NetworkStatisticsV1
	): NetworkStatistics {
		const networkStatistics = new NetworkStatistics();
		PropertyMapper.mapProperties(networkStatsObject, networkStatistics, [
			'time'
		]);
		networkStatistics.time = new Date(networkStatsObject.time);

		return networkStatistics;
	}
}
