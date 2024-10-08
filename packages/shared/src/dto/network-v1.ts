import {JSONSchemaType} from "ajv";
import {NodeV1} from "./node-v1";
import {OrganizationV1} from "./organization-v1";
import {BaseQuorumSet} from "../quorum-set";

export interface NetworkStatisticsV1 {
    time: string;
    nrOfActiveWatchers: number;
    nrOfActiveValidators: number;
    nrOfActiveFullValidators: number;
    nrOfActiveOrganizations: number;
    transitiveQuorumSetSize: number;
    hasTransitiveQuorumSet: boolean;
    hasQuorumIntersection: boolean;
    minBlockingSetSize: number;
    minBlockingSetFilteredSize: number;
    minBlockingSetOrgsSize: number;
    minBlockingSetOrgsFilteredSize: number;
    minBlockingSetCountrySize: number;
    minBlockingSetCountryFilteredSize: number;
    minBlockingSetISPSize: number;
    minBlockingSetISPFilteredSize: number;
    minSplittingSetSize: number;
    minSplittingSetOrgsSize: number;
    minSplittingSetCountrySize: number;
    minSplittingSetISPSize: number;
    topTierSize: number;
    topTierOrgsSize: number;
    hasSymmetricTopTier: boolean;
}

export interface NetworkV1 {
    time: string;
    latestLedger: string;
    statistics: NetworkStatisticsV1;
    id: string;
    name: string;
    passPhrase: string;
    nodes: Array<NodeV1>;
    organizations: OrganizationV1[];
    transitiveQuorumSet: string[];
    scc: string[][];
    overlayMinVersion?: number;
    overlayVersion?: number;
    maxLedgerVersion?: number;
    stellarCoreVersion?: string;
    quorumSetConfiguration?: BaseQuorumSet;
}

export const NetworkV1Schema: JSONSchemaType<NetworkV1> = {
    $id: "network-v1.json",
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
        time: {
            format: "date-time",
            type: "string",
            description: "Network state at time x"
        },
        latestLedger: {
            type: "string",
            description: "The latest ledger that was closed in the network at time x"
        },
        statistics: {
            $ref: "#/definitions/NetworkStatisticsV1"
        },
        id: {
            type: "string",
            description: "Network ID",
            default: "Public Global Stellar Network ; September 2015"
        },
        passPhrase: {
            type: "string",
            description: "Network passphrase",
            default: "Public Global Stellar Network ; September 2015"
        },
        name: {
            type: "string",
            description: "Network name",
            default: "Public network"
        },
        nodes: {
            type: "array",
            items: {
                $ref: "node-v1.json",
                type: 'object', required: []
            }
        },
        organizations: {
            items: {
                $ref: "organization-v1.json",
                type: 'object', required: []
            },
            type: "array"
        },
        transitiveQuorumSet: {
            items: {
                type: "string"
            },
            type: "array",
            description: "array of nodes in the transitive quorum-set of the trust graph with no outgoing edges"
        },
        scc: {
            items: {
                type: "array",
                items: {
                    type: "string"
                }
            },
            type: "array",
            description: "Strongly connected components in the trust graph"
        },
        overlayMinVersion: {
            type: "number",
            description: "Minimum overlay version required to connect to the network",
            nullable: true
        },
        overlayVersion: {
            type: "number",
            description: "Overlay version of the network",
            nullable: true
        },
        maxLedgerVersion: {
            type: "number",
            description: "Maximum ledger version of the network",
            nullable: true
        },
        stellarCoreVersion: {
            type: "string",
            description: "Latest Stellar core version running on the nodes of the network",
            nullable: true
        },
        quorumSetConfiguration:
            {"$ref": "#/definitions/BaseQuorumSet"},
    },
    type: "object",
    required: [
        "nodes",
        "organizations",
        "time",
        "latestLedger",
        "statistics",
        "id",
        "name",
        "transitiveQuorumSet",
        "scc"
    ],

    definitions: {
        "BaseQuorumSet": {
            "properties": {
                "innerQuorumSets": {
                    type: "array",
                    items: {$ref: '#/definitions/BaseQuorumSet', type: 'object', required: []}
                },
                "threshold": {
                    "type": "number"
                },
                "validators": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                }
            },
            "type": "object",
            nullable: true,
            "required": [
                "threshold",
                "validators",
                "innerQuorumSets"
            ]
        },
        NetworkStatisticsV1: {
            properties: {
                "hasQuorumIntersection": {
                    type: "boolean",
                    description: "Does the network have quorum intersection"
                },
                "hasTransitiveQuorumSet": {
                    default: false,
                    type: "boolean",
                    description: "Does the network have a transitive quorum set"
                },
                "minBlockingSetFilteredSize": {
                    default: 0,
                    type: "number",
                    description: "The size of the smallest network blocking set with failing nodes filtered out"
                },
                "minBlockingSetOrgsFilteredSize": {
                    type: "number",
                    description: "The size of the smallest network blocking set grouped by organizations, with failing organizations filtered out"
                },
                "minBlockingSetOrgsSize": {
                    type: "number",
                    description: "The size of the smallest network blocking set grouped by organizations"
                },
                "minBlockingSetSize": {
                    type: "number",
                    description: "The size of the smallest network blocking set"
                },
                "minSplittingSetOrgsSize": {
                    type: "number",
                    description: "The size of the smallest network splitting set, grouped by organizations"
                },
                "minSplittingSetCountrySize": {
                    type: "number",
                    description: "The size of the smallest network splitting set, grouped by countries"
                },
                "minSplittingSetISPSize": {
                    type: "number",
                    description: "The size of the smallest network splitting set, grouped by ISPs"
                },
                "minSplittingSetSize": {
                    type: "number",
                    description: "The size of the smallest network splitting set"
                },
                "nrOfActiveFullValidators": {
                    default: 0,
                    type: "number",
                    description: "Number of active full validators"
                },
                "nrOfActiveOrganizations": {
                    default: 0,
                    type: "number",
                    description: "Number of active organizations"
                },
                "nrOfActiveValidators": {
                    default: 0,
                    type: "number",
                    description: "Number of active validators"
                },
                "nrOfActiveWatchers": {
                    default: 0,
                    type: "number",
                    description: "Number of active watcher nodes"
                },
                "time": {
                    "format": "date-time",
                    type: "string",
                    description: "Time of the statistics"
                },
                "topTierOrgsSize": {
                    type: "number",
                    description: "Number of organizations in the top tier"
                },
                "topTierSize": {
                    type: "number",
                    description: "Number of nodes in the top tier"
                },
                "transitiveQuorumSetSize": {
                    default: 0,
                    type: "number",
                    description: "Number of nodes in the transitive quorum set"
                }
            },
            type: "object",
            required: [
                "hasQuorumIntersection",
                "hasTransitiveQuorumSet",
                "minBlockingSetFilteredSize",
                "minBlockingSetOrgsFilteredSize",
                "minBlockingSetOrgsSize",
                "minBlockingSetSize",
                "minBlockingSetCountrySize",
                "minBlockingSetCountryFilteredSize",
                "minBlockingSetISPFilteredSize",
                "hasSymmetricTopTier",
                "minBlockingSetISPSize",
                "minSplittingSetOrgsSize",
                "minSplittingSetCountrySize",
                "minSplittingSetISPSize",
                "minSplittingSetSize",
                "nrOfActiveFullValidators",
                "nrOfActiveOrganizations",
                "nrOfActiveValidators",
                "nrOfActiveWatchers",
                "time",
                "topTierOrgsSize",
                "topTierSize",
                "transitiveQuorumSetSize"
            ]
        }
    }
}