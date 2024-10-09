import { PublicKey } from 'shared';

export type QuorumSetHash = string;

export class QuorumSetState {
	quorumSetOwners = new Map<QuorumSetHash, Set<PublicKey>>();
	quorumSetRequestedTo = new Map<QuorumSetHash, Set<PublicKey>>();
	quorumSetHashesInProgress = new Set<QuorumSetHash>();
	quorumSetRequests = new Map<
		PublicKey,
		{
			timeout: NodeJS.Timeout;
			hash: QuorumSetHash;
		}
	>();
}
