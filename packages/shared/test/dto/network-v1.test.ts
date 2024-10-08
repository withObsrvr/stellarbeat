import Ajv from "ajv";
import * as addFormats from "ajv-formats";
import {NodeV1Schema} from "../../src/dto/node-v1";
import {NetworkV1Schema} from "../../src/dto/network-v1";
import {OrganizationV1Schema} from "../../src/dto/organization-v1";
import {createDummyNodeV1} from "./node-v1.test";
import {createDummyOrganizationV1} from "./organization-v1.test";

describe('NetworkV1', () => {
    test('fromV1', () => {
        const network = createDummyNetwork();
        network.nodes = [createDummyNodeV1()];
        network.organizations = [createDummyOrganizationV1()];
        const validate = compileValidate();
        const valid = validate(network);
        expect(valid).toBe(true);
    })
})

function createDummyNetwork(): Record<string, unknown> {
    return JSON.parse('{"id":"public","name":"Stellar Public Network","time":"2023-02-16T11:41:52.284Z","latestLedger":"44972815","transitiveQuorumSet":["GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2","GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z"],"scc":[["GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2","GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z"],["GA7ZMJ4ZVESLYYZCQIAQBELF6PPSHUQGUYEKEWSUGFZRJPIKKXKSHNLC","GDMAU3NHV4H7NZF5PY6O6SULIUKIIHPRYOKM7HMREK4BW65VHMDKNM6M"]],"statistics":{"time":"2023-02-16T11:42:13.125Z","nrOfActiveWatchers":73,"nrOfActiveValidators":49,"nrOfActiveFullValidators":39,"nrOfActiveOrganizations":12,"transitiveQuorumSetSize":23,"hasTransitiveQuorumSet":true,"minBlockingSetFilteredSize":6,"hasSymmetricTopTier":true,"topTierSize":23,"topTierOrgsSize":7,"hasQuorumIntersection":true,"minBlockingSetSize":6,"minBlockingSetOrgsSize":3,"minBlockingSetOrgsFilteredSize":3,"minBlockingSetCountrySize":2,"minBlockingSetCountryFilteredSize":2,"minBlockingSetISPSize":2,"minBlockingSetISPFilteredSize":2,"minSplittingSetSize":3,"minSplittingSetOrgsSize":3,"minSplittingSetCountrySize":1,"minSplittingSetISPSize":1}}');
}

function compileValidate() {
    const ajv = new Ajv();
    addFormats.default(ajv);
    return ajv.addSchema(NodeV1Schema).addSchema(OrganizationV1Schema).compile(NetworkV1Schema);
}
