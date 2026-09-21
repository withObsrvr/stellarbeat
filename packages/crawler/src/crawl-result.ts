import { PeerNode } from './peer-node';
import { Ledger } from './crawler';
import { ConnectionAttempt } from './connection-attempt';

export interface CrawlResult {
	peers: Map<string, PeerNode>;
	closedLedgers: bigint[];
	latestClosedLedger: Ledger;
	connectionAttempts?: ConnectionAttempt[];
}
