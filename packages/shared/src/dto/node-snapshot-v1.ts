import {JSONSchemaType} from "ajv";
import {NodeV1} from "./node-v1";

export interface NodeSnapshotV1 {
	startDate: string;
	endDate: string;
	node: NodeV1;
}


export const NodeSnapshotV1Schema: JSONSchemaType<NodeSnapshotV1> = {
	"$id": "node-snapshot-v1.json",
	"$schema": "http://json-schema.org/draft-07/schema#",
	"properties": {
		"startDate": {
			"format": "date-time",
			"type": "string"
		},
		"endDate": {
			"format": "date-time",
			"type": "string"
		},
		"node": {
			"$ref": "node-v1.json"
		}
	},
	"type": "object",
	"required": [
		"startDate",
		"endDate",
		"node"
	]
};
