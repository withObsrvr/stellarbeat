import { AsyncResultCallback } from 'async';
import { NodeAddress } from './node-address';
import { Observation } from './network-observer/observation';
import { ConnectionAttempt } from './connection-attempt';

type PeerKey = string; //ip:port

export enum CrawlProcessState {
	IDLE,
	TOP_TIER_SYNC,
	CRAWLING,
	STOPPING
}

export class Crawl {
	state: CrawlProcessState = CrawlProcessState.IDLE;
	maxCrawlTimeHit = false;
	crawlQueueTaskDoneCallbacks = new Map<string, AsyncResultCallback<void>>();
	crawledNodeAddresses = new Set<PeerKey>();

	failedConnections: string[] = [];
	connectionAttempts: ConnectionAttempt[] = [];
	peerAddressesReceivedDuringSync: NodeAddress[] = [];

	constructor(
		public nodesToCrawl: NodeAddress[],
		public observation: Observation
	) {}
}
