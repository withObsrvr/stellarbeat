import type { ValidateFunction } from 'ajv/dist/types';
import { NetworkV1 } from '../network-v1';
import { NodeV1 } from '../node-v1';
import { OrganizationV1 } from '../organization-v1';
import { NodeSnapshotV1 } from '../node-snapshot-v1';
import { OrganizationSnapshotV1 } from '../organization-snapshot-v1';

declare const validators: {
	'network-v1.json': ValidateFunction<NetworkV1>;
	'node-v1.json': ValidateFunction<NodeV1>;
	'organization-v1.json': ValidateFunction<OrganizationV1>;
	'node-snapshot-v1.json': ValidateFunction<NodeSnapshotV1>;
	'organization-snapshot-v1.json': ValidateFunction<OrganizationSnapshotV1>;
};

export default validators;

