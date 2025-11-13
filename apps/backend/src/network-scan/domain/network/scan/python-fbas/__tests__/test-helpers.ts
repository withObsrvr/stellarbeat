import { createDummyNode } from '../../../node/__fixtures__/createDummyNode';
import { createDummyPublicKey } from '../../../node/__fixtures__/createDummyPublicKey';
import Node from '../../../node/Node';
import Organization from '../../../organization/Organization';
import { OrganizationId } from '../../../organization/OrganizationId';
import { OrganizationValidators } from '../../../organization/OrganizationValidators';
import NodeQuorumSet from '../../../node/NodeQuorumSet';
import { QuorumSet } from 'shared';

export function createNodeWithQuorumSet(
	publicKey: string,
	quorumSet: QuorumSet,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	node.publicKey.value = publicKey;
	node.updateQuorumSet(new NodeQuorumSet(quorumSet, 'hash'), time);
	return node;
}

export function createOrganizationWithValidators(
	orgId: string,
	validators: string[],
	name?: string
): Organization {
	return Organization.create(
		new OrganizationId(orgId),
		OrganizationValidators.create(validators.map((v) => createDummyPublicKey(v))),
		name
	);
}

export function createNodeWithGeoData(
	publicKey: string,
	countryName: string,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	node.publicKey.value = publicKey;
	node.geoData = { countryName, latitude: 0, longitude: 0 };
	return node;
}

export function createNodeWithISP(
	publicKey: string,
	isp: string,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);
	node.publicKey.value = publicKey;
	node.isp = isp;
	return node;
}
