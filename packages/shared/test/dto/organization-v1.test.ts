import Ajv from 'ajv';
import * as addFormats from 'ajv-formats';
import {OrganizationV1Schema} from "../../src/dto/organization-v1";


describe('OrganizationV1', () => {
    test('fromV1', () => {
        const organizationV1 = createDummyOrganizationV1();
        const validate = compileValidation();
        const valid = validate(organizationV1);
        expect(valid).toBe(true);
    })
});

export function createDummyOrganizationV1(): Record<string, unknown> {
    const json = '{"id":"266107f8966d45eedce41fee2581326d","name":"Stellar Development Foundation","dba":null,"url":"https://www.stellar.org","horizonUrl":"https://horizon.stellar.org","logo":null,"description":null,"physicalAddress":null,"phoneNumber":null,"keybase":null,"twitter":"StellarOrg","github":"stellar","officialEmail":null,"validators":["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH","GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ","GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK"],"subQuorumAvailable":true,"subQuorum24HoursAvailability":100,"subQuorum30DaysAvailability":100,"has30DayStats":true,"has24HourStats":true,"dateDiscovered":"2019-06-10T06:42:46.560Z","isTierOneOrganization":true,"homeDomain":"www.stellar.org", "tomlState":"Unknown"}'
    return JSON.parse(json);
}

function compileValidation() {
    const ajv = new Ajv();
    addFormats.default(ajv);
    return ajv.compile(OrganizationV1Schema);
}
