import { writeFileSync } from 'fs';
import path, { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import {
	NodeV1Schema,
	NodeSnapshotV1Schema,
	OrganizationV1Schema,
	OrganizationSnapshotV1Schema,
	NetworkV1Schema
} from './lib/network';
import standaloneCode from 'ajv/dist/standalone';

// For CJS, it generates an exports array, will generate
// `exports["#/definitions/Foo"] = ...;exports["#/definitions/Bar"] = ... ;`
const ajv = new Ajv({
	schemas: [
		NodeV1Schema,
		NodeSnapshotV1Schema,
		OrganizationV1Schema,
		OrganizationSnapshotV1Schema,
		NetworkV1Schema
	],
	code: { source: true }
});
addFormats(ajv);
const moduleCode = standaloneCode(ajv);

// Now you can write the module code to file
writeFileSync(
	join(path._dirname, './lib/dto/generated/validators.js'),
	moduleCode
);
