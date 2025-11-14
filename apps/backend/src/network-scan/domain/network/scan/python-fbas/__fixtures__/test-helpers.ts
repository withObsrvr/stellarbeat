import { createDummyNode } from '../../../../node/__fixtures__/createDummyNode';
import { createDummyPublicKey } from '../../../../node/__fixtures__/createDummyPublicKey';
import { createDummyOrganizationId } from '../../../../organization/__fixtures__/createDummyOrganizationId';
import Node from '../../../../node/Node';
import Organization from '../../../../organization/Organization';
import { OrganizationValidators } from '../../../../organization/OrganizationValidators';
import NodeQuorumSet from '../../../../node/NodeQuorumSet';
import NodeGeoDataLocation from '../../../../node/NodeGeoDataLocation';
import NodeMeasurement from '../../../../node/NodeMeasurement';
import { QuorumSet } from 'shared';
import PublicKey from '../../../../node/PublicKey';

export function createNodeWithQuorumSet(
	quorumSetData: { threshold: number; validators: string[]; innerQuorumSets: any[] },
	autoGeneratePublicKey: boolean,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	const quorumSet = new QuorumSet(
		quorumSetData.threshold,
		quorumSetData.validators,
		quorumSetData.innerQuorumSets
	);
	node.updateQuorumSet(NodeQuorumSet.create('hash', quorumSet), time);

	// Add measurement with isValidating flag based on autoGeneratePublicKey
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = autoGeneratePublicKey;
	node.addMeasurement(measurement);

	return node;
}

export function createOrganizationWithValidators(
	validators: (string | PublicKey)[],
	name: string,
	time = new Date()
): Organization {
	const organization = Organization.create(
		createDummyOrganizationId(name),
		name,
		time
	);

	// Set the organization name
	organization.updateName(name, time);

	const publicKeys = validators.map(v =>
		typeof v === 'string' ? createDummyPublicKey() : v
	);

	organization.updateValidators(
		new OrganizationValidators(publicKeys),
		time
	);

	return organization;
}

export function createNodeWithGeoData(
	countryName: string,
	autoGeneratePublicKey: boolean,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	const geoData = NodeGeoDataLocation.create({
		countryName,
		countryCode: null,
		latitude: 0,
		longitude: 0
	});
	node.updateGeoData(geoData, time);

	// Add a minimal quorum set so aggregation works
	const quorumSet = new QuorumSet(1, [node.publicKey.value], []);
	node.updateQuorumSet(NodeQuorumSet.create('hash', quorumSet), time);

	// Add measurement with isValidating flag based on autoGeneratePublicKey
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = autoGeneratePublicKey;
	node.addMeasurement(measurement);

	return node;
}

export function createNodeWithISP(
	isp: string,
	autoGeneratePublicKey: boolean,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	node.updateIsp(isp, time);

	// Add a minimal quorum set so aggregation works
	const quorumSet = new QuorumSet(1, [node.publicKey.value], []);
	node.updateQuorumSet(NodeQuorumSet.create('hash', quorumSet), time);

	// Add measurement with isValidating flag based on autoGeneratePublicKey
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = autoGeneratePublicKey;
	node.addMeasurement(measurement);

	return node;
}
