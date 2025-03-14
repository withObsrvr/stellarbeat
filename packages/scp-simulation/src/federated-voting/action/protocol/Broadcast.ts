import { Context, ProtocolAction, PublicKey } from '../../../core';
import { Payload } from '../../../overlay/Overlay';
import { Vote } from '../../protocol';

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

	toJSON(): object {
		return {
			type: this.type,
			subType: this.subType,
			broadcaster: this.broadcaster,
			payload: this.payload.toJSON(),
			neighborBlackList: this.neighborBlackList,
			isDisrupted: this.isDisrupted
		};
	}

	static fromJSON(json: any): Broadcast {
		const neighborBlackList = Array.isArray(json.neighborBlackList)
			? json.neighborBlackList
			: [];
		const broadcast = new Broadcast(
			json.broadcaster,
			Vote.fromJSON(json.payload),
			neighborBlackList
		);
		broadcast.isDisrupted = json.isDisrupted;
		return broadcast;
	}
}
