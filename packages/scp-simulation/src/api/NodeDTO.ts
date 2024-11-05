import { PublicKey } from '..';
import { BaseQuorumSet } from '../node/BaseQuorumSet';
import { FederatedVoteDTO } from './FederatedVoteDTO';

export interface NodeDTO {
	publicKey: string;
	quorumSet?: BaseQuorumSet;
	connections: PublicKey[];
	federatedVote: FederatedVoteDTO;
}
