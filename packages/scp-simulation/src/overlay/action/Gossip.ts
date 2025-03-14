import { Context, ProtocolAction } from '../../core';
import { Vote } from '../../federated-voting';
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

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			sender: this.sender,
			payload: this.payload.toJSON(),
			neighborBlackList: this.neighborBlackList,
			isDisrupted: this.isDisrupted
		};
	}

	static fromJSON(json: any): Gossip {
		const gossip = new Gossip(json.sender, Vote.fromJSON(json.payload));
		gossip.blackListNeighbors(json.neighborBlackList);
		gossip.isDisrupted = json.isDisrupted;
		return gossip;
	}
}
