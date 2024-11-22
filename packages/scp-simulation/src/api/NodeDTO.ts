import { PublicKey } from '..';
import { QuorumSet } from '../core/QuorumSet';
import { FederatedVoteDTO } from './FederatedVoteDTO';

export interface NodeDTO {
	publicKey: string;
	quorumSet?: QuorumSet;
	connections: PublicKey[];
	federatedVotingState: FederatedVoteDTO;
}
