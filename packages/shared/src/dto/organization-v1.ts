import {JSONSchemaType} from "ajv";
import {nullable} from "./helper/nullable";

export interface OrganizationV1 {
    id: string;
    name: string | null;
    dba: string | null;
    url: string | null;
    horizonUrl: string | null;
    logo: string | null;
    description: string | null;
    physicalAddress: string | null;
    phoneNumber: string | null;
    keybase: string | null;
    twitter: string | null;
    github: string | null;
    officialEmail: string | null;
    validators: string[];
    subQuorumAvailable: boolean;
    has30DayStats: boolean;
    has24HourStats: boolean;
    subQuorum24HoursAvailability: number;
    subQuorum30DaysAvailability: number;
    homeDomain: string;
    dateDiscovered: string;
    isTierOneOrganization: boolean;
    tomlState: string;
}

export const OrganizationV1Schema: JSONSchemaType<OrganizationV1> = {
    "$id": "organization-v1.json",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "dateDiscovered": {
            "format": "date-time",
            "type": "string"
        },
        "dba": nullable({
            "type": "string"
        }),
        "description": nullable({
            "type": "string"
        }),
        "github": nullable({
            "type": "string"
        }),
        "has24HourStats": {
            "type": "boolean"
        },
        "has30DayStats": {
            "type": "boolean"
        },
        "horizonUrl": nullable({
            "type": "string"
        }),
        "id": {
            "type": "string"
        },
        "homeDomain": {
            "type": "string"
        },
        "isTierOneOrganization": {
            "type": "boolean"
        },
        "keybase": nullable({
            "type": "string"
        }),
        "logo": nullable({
            "type": "string"
        }),
        "name": nullable({
            "type": "string"
        }),
        "officialEmail": nullable({
            "type": "string"
        }),
        "phoneNumber": nullable({
            "type": "string"
        }),
        "physicalAddress": nullable({
            "type": "string"
        }),
        "subQuorum24HoursAvailability": {
            "type": "number"
        },
        "subQuorum30DaysAvailability": {
            "type": "number"
        },
        "subQuorumAvailable": {
            "type": "boolean"
        },
        "twitter": nullable({
            "type": "string"
        }),
        "url": nullable({
            "type": "string"
        }),
        "tomlState": {
            type: "string",
        },
        "validators": {
            "items": {
                "type": "string"
            },
            "type": "array"
        }
    },
    "type": "object",
    "required": [
        "id",
        "validators",
        "subQuorumAvailable",
        "has30DayStats",
        "has24HourStats",
        "subQuorum24HoursAvailability",
        "subQuorum30DaysAvailability",
        "dateDiscovered",
        "isTierOneOrganization",
        "dba",
        "description",
        "github",
        "horizonUrl",
        "keybase",
        "logo",
        "name",
        "officialEmail",
        "phoneNumber",
        "physicalAddress",
        "twitter",
        "url",
        "homeDomain",
        "tomlState"
    ]
}


