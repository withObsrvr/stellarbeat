import { PublicKey } from 'shared';

export type QuorumSetHash = string;

export class QuorumSetState {
	quorumSetOwners: Map<QuorumSetHash, Set<PublicKey>> = new Map();
	quorumSetRequestedTo: Map<QuorumSetHash, Set<PublicKey>> = new Map();
	quorumSetHashesInProgress: Set<QuorumSetHash> = new Set();
	quorumSetRequests: Map<
		PublicKey,
		{
			timeout: NodeJS.Timeout;
			hash: QuorumSetHash;
		}
	> = new Map();
}
