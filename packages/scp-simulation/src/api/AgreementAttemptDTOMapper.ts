import { AgreementAttempt } from '../federated-voting/agreement-attempt/AgreementAttempt';
import { AgreementAttemptDTO } from './AgreementAttemptDTO';
import { StatementDTOMapper } from './StatementDTOMapper';

export class AgreementAttemptDTOMapper {
	static toDTO(
		agreementAttempt: AgreementAttempt,
		includeQSet = false
	): AgreementAttemptDTO {
		return {
			statement: StatementDTOMapper.toStatementDTO(agreementAttempt.statement),
			votesForStatement: Array.from(
				agreementAttempt.getVotesForStatement().entries()
			).map(([publicKey, quorumSet]) => ({
				publicKey: publicKey.toString(),
				quorumSet: includeQSet ? quorumSet.toBaseQuorumSet() : undefined
			})),

			votesToAcceptStatement: Array.from(
				agreementAttempt.getAcceptVotes().entries()
			).map(([publicKey, quorumSet]) => ({
				publicKey: publicKey.toString(),
				quorumSet: includeQSet ? quorumSet.toBaseQuorumSet() : undefined
			})),
			phase: agreementAttempt.phase
		};
	}
}
