import { Node } from '../../core/Node';
import { Statement } from './Statement';
import { Vote } from './Vote';

export enum FederatedVotingPhase {
	unknown = 'unknown',
	accepted = 'accepted',
	confirmed = 'confirmed'
}

export class FederatedVotingState {
	public knownVotes: Set<Vote> = new Set();
	public voted: Statement | null = null;
	public accepted: Statement | null = null;
	public confirmed: Statement | null = null;
	public phase: FederatedVotingPhase = FederatedVotingPhase.unknown;

	constructor(public readonly node: Node) {}
}
