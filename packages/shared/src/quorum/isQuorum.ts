import { Node } from '../node';
import containsSlice from './containsSlice';

/**
 * A quorum contains a quorum slice for every node in the quorum
 */
export default function isQuorum(potentialQuorum: Node[]) {
	return potentialQuorum.every((node) =>
		containsSlice(
			node.quorumSet,
			new Set(potentialQuorum.map((node) => node.publicKey))
		)
	);
}
