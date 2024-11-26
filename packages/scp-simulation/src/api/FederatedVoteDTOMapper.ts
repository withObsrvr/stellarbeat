import { FederatedVotingProtocolState } from '../federated-voting/protocol/FederatedVotingProtocolState';
import { FederatedVoteDTO } from './FederatedVoteDTO';
import { StatementDTOMapper } from './StatementDTOMapper';

export class FederatedVoteDTOMapper {
	static toDTO(
		federatedVotingState: FederatedVotingProtocolState,
		includeQSet = false
	): FederatedVoteDTO {
		return {
			publicKey: federatedVotingState.node.publicKey,
			quorumSet: includeQSet ? federatedVotingState.node.quorumSet : undefined,
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
