import { PublicKey } from '..';
import { QuorumSet } from '../core/QuorumSet';
import { FederatedVotingPhase } from '../federated-voting/protocol/FederatedVotingProtocolState';
import { StatementDTO } from './StatementDTO';

export interface FederatedVoteDTO {
	publicKey: PublicKey;
	quorumSet?: QuorumSet;
	confirmed: StatementDTO | null;
	voted: StatementDTO | null;
	accepted: StatementDTO | null;
	phase: FederatedVotingPhase;
}
