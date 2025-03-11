import { Context, ProtocolAction, PublicKey } from '../../../core';
import { Payload } from '../../../overlay/Overlay';

export class Broadcast extends ProtocolAction {
	subType = 'Broadcast';
	public readonly publicKey: string;
	constructor(
		public readonly broadcaster: PublicKey,
		public readonly payload: Payload,
		private neighborBlackList: PublicKey[] = []
	) {
		super();
		this.publicKey = broadcaster;
	}

	execute(context: Context): ProtocolAction[] {
		return context.broadcast(
			this.broadcaster,
			this.payload,
			this.neighborBlackList
		);
	}

	blackListNeighbors(neighbors: PublicKey[]): void {
		this.neighborBlackList = neighbors;
	}
	getBlackList(): PublicKey[] {
		return this.neighborBlackList.slice();
	}

	toString(): string {
		return `${this.payload.toString()}`;
	}

	hash(): string {
		return (
			this.subType +
			this.broadcaster +
			this.payload +
			this.neighborBlackList.join('|')
		);
	}
}
