import { QuorumSet } from './QuorumSet';

export class Node {
	constructor(
		public readonly publicKey: string,
		public quorumSet: QuorumSet
	) {}
}
