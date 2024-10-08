import {NodeSnapshotV1Schema} from "../../src/dto/node-snapshot-v1";
import {createDummyNodeV1} from "./node-v1.test";
import Ajv from "ajv";
import * as addFormats from "ajv-formats";
import {NodeV1Schema} from "../../src/dto/node-v1";

describe('NodeSnapshotV1', () => {
    test('fromV1', () => {
        const snapshot = createDummyNodeSnapshotV1();
        const validate = compileValidate();
        const valid = validate(snapshot);
        expect(valid).toBe(true);
    });

    test('fromV1 with null startDate is invalid', () => {
        const snapshot = createDummyNodeSnapshotV1();
        snapshot.startDate = null;
        const validate = compileValidate();
        const valid = validate(snapshot);
        expect(valid).toBe(false);
    })


    function compileValidate() {
        const ajv = new Ajv();
        addFormats.default(ajv);
        return ajv.addSchema(NodeV1Schema).compile(NodeSnapshotV1Schema);
    }

    function createDummyNodeSnapshotV1(): Record<string, unknown> {
        return {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            node: createDummyNodeV1()
        };
    }
});