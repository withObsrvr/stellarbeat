import { PublicKey } from '..';
import { FederatedVotingPhase } from '../federated-voting-protocol/FederatedVotingState';
import { QuorumSet } from '../core/QuorumSet';
import { StatementDTO } from './StatementDTO';

export interface FederatedVoteDTO {
	publicKey: PublicKey;
	quorumSet?: QuorumSet;
	confirmed: StatementDTO | null;
	voted: StatementDTO | null;
	accepted: StatementDTO | null;
	phase: FederatedVotingPhase;
}
