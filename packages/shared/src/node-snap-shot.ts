import { Node } from './node';
import {NodeSnapshotV1} from "./dto/node-snapshot-v1";

export class NodeSnapShot {
	public startDate: Date;
	public endDate: Date;
	public node: Node;

	constructor(startDate: Date, endDate: Date, node: Node) {
		this.startDate = startDate;
		this.endDate = endDate;
		this.node = node;
	}

	toJSON(): Record<string, unknown> {
		return {
			startDate: this.startDate,
			endDate: this.endDate,
			node: this.node
		};
	}

	static fromNodeSnapshotV1(
		nodeSnapshotV1DTO: NodeSnapshotV1
	): NodeSnapShot {
		return new NodeSnapShot(
			new Date(nodeSnapshotV1DTO.startDate),
			new Date(nodeSnapshotV1DTO.endDate),
			Node.fromNodeV1DTO(nodeSnapshotV1DTO.node)
		);
	}
}
