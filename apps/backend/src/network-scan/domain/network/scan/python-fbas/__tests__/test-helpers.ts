/**
 * Test fixtures for Python FBAS tests
 * These helpers properly create nodes, measurements, and organizations using the domain API
 */

import { createDummyNode } from '../../../node/__fixtures__/createDummyNode';
import { createDummyOrganizationId } from '../../../organization/__fixtures__/createDummyOrganizationId';
import { createDummyPublicKey } from '../../../node/__fixtures__/createDummyPublicKey';
import Node from '../../../node/Node';
import Organization from '../../../organization/Organization';
import NodeMeasurement from '../../../node/NodeMeasurement';
import NodeQuorumSet from '../../../node/NodeQuorumSet';
import { QuorumSet, BaseQuorumSet } from 'shared';
import NodeGeoDataLocation from '../../../node/NodeGeoDataLocation';
import PublicKey from '../../../node/PublicKey';
import { OrganizationValidators } from '../../../organization/OrganizationValidators';
import { OrganizationId } from '../../../organization/OrganizationId';

/**
 * Create a node with a quorum set and measurement
 */
export function createNodeWithQuorumSet(
	quorumSet: BaseQuorumSet,
	isValidating = true,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);

	// Convert plain object to QuorumSet if needed
	const qsInstance = QuorumSet.fromBaseQuorumSet(quorumSet);

	// Create and set quorum set
	const nodeQuorumSet = NodeQuorumSet.create(
		'hash-' + Math.random(),
		qsInstance
	);
	node.updateQuorumSet(nodeQuorumSet, time);

	// Create and add measurement
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = isValidating;
	node.addMeasurement(measurement);

	return node;
}

/**
 * Create an organization with validators
 */
export function createOrganizationWithValidators(
	validatorPublicKeys: PublicKey[],
	name?: string,
	time = new Date()
): Organization {
	const orgId = createDummyOrganizationId();
	const orgName = name || 'Test Org';
	const org = Organization.create(orgId, orgName, time);

	// Update name (homeDomain is set by create, but name needs to be updated)
	org.updateName(orgName, time);

	// Update validators
	const validators = new OrganizationValidators(validatorPublicKeys);
	org.updateValidators(validators, time);

	return org;
}

/**
 * Create a node with geo data
 */
export function createNodeWithGeoData(
	countryName: string,
	isValidating = true,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);

	// Set quorum set (self-referencing)
	const quorumSet = NodeQuorumSet.create(
		'hash-' + Math.random(),
		new QuorumSet(1, [node.publicKey.value], [])
	);
	node.updateQuorumSet(quorumSet, time);

	// Set geo data
	const geoData = NodeGeoDataLocation.create({
		latitude: 0,
		longitude: 0,
		countryName: countryName,
		countryCode: 'XX'
	});
	node.updateGeoData(geoData, time);

	// Add measurement
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = isValidating;
	node.addMeasurement(measurement);

	return node;
}

/**
 * Create a node with ISP
 */
export function createNodeWithISP(
	isp: string,
	isValidating = true,
	time = new Date()
): Node {
	const node = createDummyNode(undefined, undefined, time);

	// Set quorum set (self-referencing)
	const quorumSet = NodeQuorumSet.create(
		'hash-' + Math.random(),
		new QuorumSet(1, [node.publicKey.value], [])
	);
	node.updateQuorumSet(quorumSet, time);

	// Set ISP
	node.updateIsp(isp, time);

	// Add measurement
	const measurement = new NodeMeasurement(time, node);
	measurement.isValidating = isValidating;
	node.addMeasurement(measurement);

	return node;
}

/**
 * Create a simple network with circular quorum structure
 */
export function createSimpleNetwork(time = new Date()): Node[] {
	const nodes = [
		createDummyNode('127.0.0.1', 11625, time),
		createDummyNode('127.0.0.2', 11625, time),
		createDummyNode('127.0.0.3', 11625, time),
		createDummyNode('127.0.0.4', 11625, time)
	];

	// Node 0 trusts 1, 2
	const qs0 = NodeQuorumSet.create(
		'hash0',
		new QuorumSet(2, [nodes[1].publicKey.value, nodes[2].publicKey.value], [])
	);
	nodes[0].updateQuorumSet(qs0, time);

	// Node 1 trusts 0, 2
	const qs1 = NodeQuorumSet.create(
		'hash1',
		new QuorumSet(2, [nodes[0].publicKey.value, nodes[2].publicKey.value], [])
	);
	nodes[1].updateQuorumSet(qs1, time);

	// Node 2 trusts 0, 1, 3
	const qs2 = NodeQuorumSet.create(
		'hash2',
		new QuorumSet(2, [
			nodes[0].publicKey.value,
			nodes[1].publicKey.value,
			nodes[3].publicKey.value
		], [])
	);
	nodes[2].updateQuorumSet(qs2, time);

	// Node 3 trusts 2
	const qs3 = NodeQuorumSet.create(
		'hash3',
		new QuorumSet(1, [nodes[2].publicKey.value], [])
	);
	nodes[3].updateQuorumSet(qs3, time);

	// Add measurements (all validating)
	nodes.forEach((node) => {
		const measurement = new NodeMeasurement(time, node);
		measurement.isValidating = true;
		node.addMeasurement(measurement);
	});

	return nodes;
}
