import { Context, ProtocolAction } from '../../core';
import { Payload } from '../Overlay';

type PublicKey = string;

export class Gossip extends ProtocolAction {
	readonly subType = 'Gossip';
	readonly publicKey: PublicKey;
	private neighborBlackList: PublicKey[] = [];

	constructor(
		public readonly sender: PublicKey,
		public readonly payload: Payload
	) {
		super();
		this.publicKey = sender;
	}

	execute(context: Context): ProtocolAction[] {
		return context.gossip(this.sender, this.payload, this.neighborBlackList);
	}

	blackListNeighbors(neighbors: PublicKey[]): void {
		this.neighborBlackList = neighbors;
	}

	getBlackList(): PublicKey[] {
		return this.neighborBlackList.slice();
	}

	toString(): string {
		return `${this.sender} gossips message: "${this.payload}"`;
	}

	hash(): string {
		return this.subType + this.sender + this.payload;
	}
}
