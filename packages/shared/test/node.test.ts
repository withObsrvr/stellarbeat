import { Node } from '../src';
import Ajv from 'ajv';
import * as addFormats from 'ajv-formats';
import { NodeV1Schema } from '../src/dto/node-v1';

const node = new Node(
	'GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK'
);
node.name = 'SDF validator 2';
node.host = 'core-live-b.stellar.org';
node.ledgerVersion = null;
node.activeInScp = true;
node.geoData.countryName = 'United States';
node.geoData.countryCode = 'US';
node.geoData.latitude = 39.0853;
node.geoData.longitude = -77.6452;
node.versionStr = 'v10.0.0';
node.dateDiscovered = new Date('2018-04-28T12:39:01.000Z');
node.dateUpdated = new Date('2018-10-12T09:17:39.000Z');
node.quorumSetHashKey = 'dbROBZB26KK3PELCVOi5CDds2zSvTK5GOPTqVXBMw8=';
node.quorumSet.threshold = 2;
node.quorumSet.innerQuorumSets = [];
node.quorumSet.validators = [
	'GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ'
];
node.active = true;
node.overLoaded = true;
node.isFullValidator = true;
node.homeDomain = 'my-domain';
node.isValidating = true;

node.organizationId = '123';
node.alias = 'my-alias';
node.historyUrl = 'https://my-history.net';
node.isp = 'amazon.com Inc.';
node.statistics.has30DayStats = true;
node.statistics.has24HourStats = true;
node.historyArchiveHasError = true;
node.ledgerVersion = 1;
node.overlayMinVersion = 2;
node.overlayVersion = 3;
node.connectivityError = true;
node.stellarCoreVersionBehind = true;
node.lag = 30;

const nodeObject: Record<string, unknown> = {};
nodeObject.name = 'SDF validator 2';
nodeObject.host = 'core-live-b.stellar.org';
nodeObject.index = 0;
nodeObject.ip = '127.0.0.1';
nodeObject.port = 11625;
nodeObject.publicKey =
	'GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK';
nodeObject.geoData = {
	countryName: 'United States',
	countryCode: 'US',
	latitude: 39.0853,
	longitude: -77.6452
};
nodeObject.versionStr = 'v10.0.0';
nodeObject.statistics = {
	active24HoursPercentage: 0,
	active30DaysPercentage: 0,
	validating24HoursPercentage: 0,
	validating30DaysPercentage: 0,
	overLoaded24HoursPercentage: 0,
	overLoaded30DaysPercentage: 0,
	has30DayStats: true,
	has24HourStats: true
};

nodeObject.dateDiscovered = '2018-04-28T12:39:01.000Z';
nodeObject.dateUpdated = '2018-10-12T09:17:39.000Z';
nodeObject.quorumSetHashKey = 'dbROBZB26KK3PELCVOi5CDds2zSvTK5GOPTqVXBMw8=';
nodeObject.quorumSet = {
	threshold: 2,
	validators: ['GABMKJM6I25XI4K7U6XWMULOUQIQ27BCTMLS6BYYSOWKTBUXVRJSXHYQ'],
	innerQuorumSets: []
};
nodeObject.active = true;
nodeObject.overLoaded = true;
nodeObject.isFullValidator = true;
nodeObject.homeDomain = 'my-domain';
nodeObject.isValidating = true;
nodeObject.organizationId = '123';
nodeObject.alias = 'my-alias';
nodeObject.historyUrl = 'https://my-history.net';
nodeObject.isp = 'amazon.com Inc.';

nodeObject.isValidator = true;
nodeObject.activeInScp = true;
nodeObject.ledgerVersion = 1;
nodeObject.overlayMinVersion = 2;
nodeObject.overlayVersion = 3;
nodeObject.historyArchiveHasError = true;
nodeObject.connectivityError = true;
nodeObject.stellarCoreVersionBehind = true;
nodeObject.lag = 30;

test('nodeToJson', () => {
	expect(JSON.parse(JSON.stringify(node))).toEqual(nodeObject);
});

test('JsonToNode', () => {
	const ajv = new Ajv();
	addFormats.default(ajv);
	const validate = ajv.compile(NodeV1Schema);
	const valid = validate(nodeObject);
	expect(valid).toBeTruthy();
	if (!valid) {
		return;
	}
	expect(Node.fromNodeV1DTO(nodeObject)).toEqual(node);
});
const node3 = new Node('a');
test('testDefaultPort', () => {
	expect(node3.port).toEqual(11625);
});
