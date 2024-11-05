import { NodeOrchestrator } from '../node/NodeOrchestrator';
import { FederatedVoteDTOMapper } from './FederatedVoteDTOMapper';
import { NodeDTO } from './NodeDTO';

export class NodeDTOMapper {
	static toDTO(node: NodeOrchestrator, includeQSet = false): NodeDTO {
		return {
			publicKey: node.publicKey.toString(),
			quorumSet: includeQSet ? node.getQuorumSet() : undefined,
			connections: node.getConnections(),
			federatedVote: FederatedVoteDTOMapper.toDTO(
				node.getFederatedVote(),
				includeQSet
			)
		};
	}
}
