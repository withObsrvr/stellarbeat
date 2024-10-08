import { BaseQuorumSet } from '../quorum-set';
import { JSONSchemaType } from 'ajv';
import { nullable } from './helper/nullable';

export interface NodeGeoDataV1 {
	countryCode: string | null;
	countryName: string | null;
	latitude: number | null;
	longitude: number | null;
}

export interface NodeStatisticsV1 {
	active30DaysPercentage: number;
	overLoaded30DaysPercentage: number;
	validating30DaysPercentage: number;
	active24HoursPercentage: number;
	overLoaded24HoursPercentage: number;
	validating24HoursPercentage: number;
	has30DayStats: boolean;
	has24HourStats: boolean;
}

export interface NodeV1 {
	ip: string;
	port: number;
	publicKey: string;
	name: string | null;
	host: string | null;
	ledgerVersion: number | null;
	overlayVersion: number | null;
	overlayMinVersion: number | null;
	versionStr: string | null;
	quorumSet: BaseQuorumSet | null;
	quorumSetHashKey: string | null;
	active: boolean;
	activeInScp: boolean;
	geoData: NodeGeoDataV1 | null;
	statistics: NodeStatisticsV1;
	dateDiscovered: string;
	dateUpdated: string;
	overLoaded: boolean;
	isFullValidator: boolean;
	isValidating: boolean;
	homeDomain: string | null;
	index: number;
	historyUrl: string | null;
	alias: string | null;
	isp: string | null;
	organizationId: string | null;
	historyArchiveHasError: boolean;
	isValidator: boolean;
	connectivityError: boolean;
	stellarCoreVersionBehind: boolean;
	lag: number | null;
}

export const NodeV1Schema: JSONSchemaType<NodeV1> = {
	$id: 'node-v1.json',
	$schema: 'http://json-schema.org/draft-07/schema#',
	properties: {
		active: {
			default: false,
			type: 'boolean',
			description: 'Node accepts connections from other nodes'
		},
		activeInScp: {
			default: false,
			type: 'boolean',
			description: 'Node is active in SCP'
		},
		alias: nullable({
			type: 'string'
		}),
		dateDiscovered: {
			format: 'date-time',
			type: 'string'
		},
		dateUpdated: {
			format: 'date-time',
			type: 'string'
		},
		geoData: {
			$ref: '#/definitions/NodeGeoDataV1'
		},
		historyUrl: nullable({
			type: 'string'
		}),
		homeDomain: nullable({
			type: 'string'
		}),
		lag: nullable({
			type: 'number'
		}),
		host: nullable({ type: 'string' }),
		index: {
			default: 0,
			type: 'number',
			description:
				'Used to compare nodes. The more trustworthy, the higher the index.'
		},
		ip: {
			default: '127.0.0.1',
			type: 'string'
		},
		isFullValidator: {
			default: false,
			type: 'boolean'
		},
		isValidating: {
			default: false,
			type: 'boolean',
			description: 'Participating in SCP and externalizing new values'
		},
		isValidator: {
			type: 'boolean'
		},
		isp: nullable({
			type: 'string'
		}),
		ledgerVersion: nullable({
			type: 'number'
		}),
		name: nullable({ type: 'string' }),
		organizationId: nullable({
			type: 'string'
		}),
		overLoaded: {
			type: 'boolean',
			description: 'When node disconnects with err_load'
		},
		overlayMinVersion: nullable({
			type: 'number'
		}),
		overlayVersion: nullable({
			type: 'number'
		}),
		port: {
			type: 'number'
		},
		publicKey: {
			type: 'string'
		},
		quorumSet: { $ref: '#/definitions/BaseQuorumSet' },
		quorumSetHashKey: nullable({ type: 'string' }),
		statistics: {
			$ref: '#/definitions/NodeStatisticsV1'
		},
		versionStr: nullable({
			type: 'string'
		}),
		historyArchiveHasError: {
			type: 'boolean'
		},
		connectivityError: {
			type: 'boolean'
		},
		stellarCoreVersionBehind: {
			type: 'boolean'
		}
	},
	type: 'object',
	required: [
		'publicKey',
		'organizationId',
		'alias',
		'name',
		'host',
		'ip',
		'port',
		'ledgerVersion',
		'historyUrl',
		'overlayVersion',
		'overlayMinVersion',
		'versionStr',
		'active',
		'activeInScp',
		'dateDiscovered',
		'dateUpdated',
		'overLoaded',
		'isFullValidator',
		'isValidating',
		'index',
		'isp',
		'isValidator',
		'historyArchiveHasError',
		'quorumSetHashKey',
		'quorumSet',
		'statistics',
		'geoData',
		'homeDomain'
	],
	definitions: {
		NodeGeoDataV1: {
			properties: {
				countryCode: nullable({
					type: 'string'
				}),
				countryName: nullable({
					type: 'string'
				}),
				latitude: nullable({
					type: 'number'
				}),
				longitude: nullable({
					type: 'number'
				})
			},
			type: 'object',
			nullable: true,
			required: ['countryCode', 'countryName', 'latitude', 'longitude']
		},
		NodeStatisticsV1: {
			properties: {
				active24HoursPercentage: {
					default: 0,
					type: 'number'
				},
				active30DaysPercentage: {
					default: 0,
					type: 'number'
				},
				has24HourStats: {
					default: false,
					type: 'boolean'
				},
				has30DayStats: {
					default: false,
					type: 'boolean'
				},
				overLoaded24HoursPercentage: {
					default: 0,
					type: 'number'
				},
				overLoaded30DaysPercentage: {
					default: 0,
					type: 'number'
				},
				validating24HoursPercentage: {
					default: 0,
					type: 'number'
				},
				validating30DaysPercentage: {
					default: 0,
					type: 'number'
				}
			},
			type: 'object',
			required: [
				'active24HoursPercentage',
				'active30DaysPercentage',
				'has24HourStats',
				'has30DayStats',
				'overLoaded24HoursPercentage',
				'overLoaded30DaysPercentage',
				'validating24HoursPercentage',
				'validating30DaysPercentage'
			]
		},
		BaseQuorumSet: {
			properties: {
				innerQuorumSets: {
					type: 'array',
					items: {
						$ref: '#/definitions/BaseQuorumSet',
						type: 'object',
						required: []
					}
				},
				threshold: {
					type: 'number'
				},
				validators: {
					items: {
						type: 'string'
					},
					type: 'array'
				}
			},
			type: 'object',
			nullable: true,
			required: ['threshold', 'validators', 'innerQuorumSets']
		}
	}
};
