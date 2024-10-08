import Ajv from 'ajv';
import * as addFormats from 'ajv-formats';
import { NodeV1Schema} from "../../src/dto/node-v1";

describe('NodeV1', () => {
    test('fromV1', () => {
        const node = createDummyNodeV1();
        const ajv = new Ajv();
        addFormats.default(ajv);
        const validate  = ajv.compile(NodeV1Schema);
        const valid = validate(node);
        expect(valid).toBe(true);
    })

    test('fromV1 with null values', () => {
        const node = createDummyNodeV1();
        node.host = null;
        node.name = null;
        node.quorumSet = null;
        node.quorumSetHashKey = null;
        node.alias = null;
        node.organizationId = null;
        node.isp = null;
        node.geoData = null;

        const ajv = new Ajv();
        addFormats.default(ajv);
        const validate  = ajv.compile(NodeV1Schema);
        const valid = validate(node);
        expect(valid).toBe(true);
    })
});
export function createDummyNodeV1(){
    const json = '{"ip":"3.85.189.15","port":11625,"host":"my-host","publicKey":"GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH","name":"SDF 1","ledgerVersion":19,"overlayVersion":27,"overlayMinVersion":24,"networkId":null,"versionStr":"stellar-core 19.7.0 (7249363c60e7ddf796187149f6a236f8ad244b2b)","active":true,"activeInScp":true,"overLoaded":false,"quorumSet":{"threshold":5,"validators":[],"innerQuorumSets":[{"threshold":2,"validators":["GAAV2GCVFLNN522ORUYFV33E76VPC22E72S75AQ6MBR5V45Z5DWVPWEU","GAVXB7SBJRYHSG6KSQHY74N7JAFRL4PFVZCNWW2ARI6ZEKNBJSMSKW7C","GAYXZ4PZ7P6QOX7EBHPIZXNWY4KCOBYWJCA4WKWRKC7XIUS3UJPT6EZ4"],"innerQuorumSets":[]},{"threshold":2,"validators":["GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ","GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH","GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK"],"innerQuorumSets":[]},{"threshold":2,"validators":["GADLA6BJK6VK33EM2IDQM37L5KGVCY5MSHSHVJA4SCNGNUIEOTCR6J5T","GAZ437J46SCFPZEDLVGDMKZPLFO77XJ4QVAURSJVRZK2T5S7XUFHXI2Z","GD6SZQV3WEJUH352NTVLKEV2JM2RH266VPEM7EH5QLLI7ZZAALMLNUVN"],"innerQuorumSets":[]},{"threshold":2,"validators":["GAK6Z5UVGUVSEK6PEOCAYJISTT5EJBB34PN3NOLEQG2SUKXRVV2F6HZY","GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT","GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE"],"innerQuorumSets":[]},{"threshold":2,"validators":["GARYGQ5F2IJEBCZJCBNPWNWVDOFK7IBOHLJKKSG2TMHDQKEEC6P4PE4V","GA7DV63PBUUWNUFAF4GAZVXU2OZMYRATDLKTC7VTCG7AU4XUPN5VRX4A","GCMSM2VFZGRPTZKPH5OABHGH4F3AVS6XTNJXDGCZ3MKCOSUBH3FL6DOB"],"innerQuorumSets":[]},{"threshold":3,"validators":["GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7","GA7TEPCBDQKI7JQLQ34ZURRMK44DVYCIGVXQQWNSWAEQR6KB4FMCBT7J","GCFONE23AB7Y6C5YZOMKUKGETPIAJA4QOYLS5VNS4JHBGKRZCPYHDLW7","GDXQB3OMMQ6MGG43PWFBZWBFKBBDUZIVSUDAZZTRAWQZKES2CDSE5HKJ","GD5QWEVV4GZZTQP46BRXV5CUMMMLP4JTGFD7FWYJJWRL54CELY6JGQ63"],"innerQuorumSets":[]},{"threshold":2,"validators":["GBLJNN3AVZZPG2FYAYTYQKECNWTQYYUUY2KVFN2OUKZKBULXIXBZ4FCT","GCIXVKNFPKWVMKJKVK2V4NK7D4TC6W3BUMXSIJ365QUAXWBRPPJXIR2Z","GCVJ4Z6TI6Z2SOGENSPXDQ2U4RKH3CNQKYUHNSSPYFPNWTLGS6EBH7I2"],"innerQuorumSets":[]}]},"quorumSetHashKey":"tMzPTDKfG5wjnXkG896RFcS4IDo9/LVddWJ1C0LZaQ4=","geoData":{"countryCode":"US","countryName":"United States","latitude":39.043701171875,"longitude":-77.47419738769531},"statistics":{"active30DaysPercentage":100,"overLoaded30DaysPercentage":23.41,"validating30DaysPercentage":100,"active24HoursPercentage":100,"overLoaded24HoursPercentage":0,"validating24HoursPercentage":100,"has24HourStats":true,"has30DayStats":true},"dateDiscovered":"2019-05-31T10:35:09.274Z","dateUpdated":"2023-02-15T15:30:16.616Z","isFullValidator":true,"isValidating":true,"isValidator":true,"index":1,"homeDomain":"www.stellar.org","organizationId":"266107f8966d45eedce41fee2581326d","historyUrl":"http://history.stellar.org/prd/core-live/core_live_001/","alias":"sdf1","isp":"amazon.com Inc.","historyArchiveHasError":false}'
    return JSON.parse(json);
}