import {JSONSchemaType} from "ajv";
import {OrganizationV1} from "./organization-v1";

export interface OrganizationSnapshotV1 {
	startDate: string;
	endDate: string;
	organization: OrganizationV1;
}


export const OrganizationSnapshotV1Schema: JSONSchemaType<OrganizationSnapshotV1> = {
	"$id": "organization-snapshot-v1.json",
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
		"organization": {
			"$ref": "organization-v1.json"
		}
	},
	"type": "object",
	"required": [
		"startDate",
		"endDate",
		"organization"
	]
};
