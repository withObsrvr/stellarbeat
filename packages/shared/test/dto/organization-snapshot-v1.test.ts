import Ajv from "ajv";
import * as addFormats from "ajv-formats";
import {OrganizationV1Schema} from "../../src/dto/organization-v1";
import {OrganizationSnapshotV1Schema} from "../../src/dto/organization-snapshot-v1";
import {createDummyOrganizationV1} from "./organization-v1.test";

describe('OrganizationSnapshotV1', () => {
    test('fromV1', () => {
        const snapshot = createDummyOrganizationSnapshotV1();
        const validate = compileValidate();
        const valid = validate(snapshot);
        expect(valid).toBe(true);
    });

    test('fromV1 with null startDate is invalid', () => {
        const snapshot = createDummyOrganizationSnapshotV1();
        snapshot.startDate = null;
        const validate = compileValidate();
        const valid = validate(snapshot);
        expect(valid).toBe(false);
    })


    function compileValidate() {
        const ajv = new Ajv();
        addFormats.default(ajv);
        return ajv.addSchema(OrganizationV1Schema).compile(OrganizationSnapshotV1Schema);
    }

    function createDummyOrganizationSnapshotV1(): Record<string, unknown> {
        return {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            organization: createDummyOrganizationV1()
        };
    }
});