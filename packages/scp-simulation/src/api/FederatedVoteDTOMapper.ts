import { FederatedVotingState } from '../federated-voting/FederatedVotingState';
import { FederatedVoteDTO } from './FederatedVoteDTO';
import { StatementDTOMapper } from './StatementDTOMapper';

export class FederatedVoteDTOMapper {
	static toDTO(
		federatedVotingState: FederatedVotingState,
		includeQSet = false
	): FederatedVoteDTO {
		return {
			publicKey: federatedVotingState.publicKey,
			quorumSet: includeQSet ? federatedVotingState.quorumSet : undefined,
			confirmed: federatedVotingState.confirmed
				? StatementDTOMapper.toStatementDTO(federatedVotingState.confirmed)
				: null,
			phase: federatedVotingState.phase,
			voted: federatedVotingState.voted
				? StatementDTOMapper.toStatementDTO(federatedVotingState.voted)
				: null,
			accepted: federatedVotingState.accepted
				? StatementDTOMapper.toStatementDTO(federatedVotingState.accepted)
				: null
		};
	}
}
