import { JSONSchemaType } from 'ajv';

export interface BucketEntry {
	curr: string;
	snap: string;
	next: {
		state: number;
		output?: string;
	};
}

export interface HistoryArchiveState {
	version: number;
	server: string;
	currentLedger: number;
	networkPassphrase?: string;
	currentBuckets: BucketEntry[];
	hotArchiveBuckets?: BucketEntry[];
}

const bucketEntrySchema = {
	type: 'object' as const,
	properties: {
		curr: { type: 'string' as const },
		snap: { type: 'string' as const },
		next: {
			type: 'object' as const,
			properties: {
				state: { type: 'number' as const },
				output: { type: 'string' as const, nullable: true as const }
			},
			required: ['state' as const]
		}
	},
	required: ['curr' as const, 'snap' as const, 'next' as const]
};

export const HistoryArchiveStateSchema: JSONSchemaType<HistoryArchiveState> = {
	type: 'object',
	properties: {
		version: { type: 'integer' },
		server: { type: 'string' },
		currentLedger: { type: 'number' },
		networkPassphrase: { type: 'string', nullable: true },
		currentBuckets: {
			type: 'array',
			items: bucketEntrySchema,
			minItems: 0
		},
		hotArchiveBuckets: {
			type: 'array',
			items: bucketEntrySchema,
			minItems: 0
		}
	},
	required: ['version', 'server', 'currentLedger', 'currentBuckets']
};
