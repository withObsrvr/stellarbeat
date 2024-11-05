import { FederatedVote } from '../federated-voting/FederatedVote';
import { AgreementAttemptDTOMapper } from './AgreementAttemptDTOMapper';
import { FederatedVoteDTO } from './FederatedVoteDTO';
import { StatementDTOMapper } from './StatementDTOMapper';

export class FederatedVoteDTOMapper {
	static toDTO(
		federatedVote: FederatedVote,
		includeQSet = false
	): FederatedVoteDTO {
		const consensus = federatedVote.getConsensus();
		return {
			publicKey: federatedVote.getNode().publicKey,
			agreementAttempts: federatedVote
				.getAgreementAttempts()
				.map((attempt) => AgreementAttemptDTOMapper.toDTO(attempt)),
			quorumSet: includeQSet
				? federatedVote.getNode().quorumSet.toBaseQuorumSet()
				: undefined,
			consensus: consensus ? StatementDTOMapper.toStatementDTO(consensus) : null
		};
	}
}
