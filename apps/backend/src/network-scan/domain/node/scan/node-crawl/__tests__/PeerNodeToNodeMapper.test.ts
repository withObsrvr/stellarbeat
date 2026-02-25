import {
	createDummyPublicKey,
	createDummyPublicKeyString
} from '../../../__fixtures__/createDummyPublicKey';
import { QuorumSet as QuorumSetDTO } from 'shared';
import { PeerNode } from 'crawler';
import { PeerNodeToNodeMapper } from '../PeerNodeToNodeMapper';
import NodeMeasurement from '../../../NodeMeasurement';
import Node from '../../../Node';
import PublicKey from '../../../PublicKey';
import { mock } from 'jest-mock-extended';

describe('PeerNodeToNodeMapper', () => {
	test('createNodeFromPeerNode', () => {
		const peerNode = createPeerNode(createDummyPublicKey());
		const time = new Date('2019-01-01T00:00:00.000Z');
		const nodeOrError = PeerNodeToNodeMapper.createNodeFromPeerNode(
			peerNode,
			time
		);
		expect(nodeOrError.isErr()).toBe(false);
		if (nodeOrError.isErr()) return;
		expect(nodeOrError.value).toBeInstanceOf(Node);
		if (!nodeOrError.value) return;

		assertEquals(nodeOrError.value, peerNode);
	});

	test('updateNodeFromPeerNode', () => {
		const time = new Date('2019-01-01T00:00:00.000Z');
		const publicKey = createDummyPublicKey();
		const node = Node.create(time, publicKey, {
			ip: 'other localhost',
			port: 2
		});

		const updateTime = new Date('2020-01-01T00:00:00.000Z');
		const peerNode = createPeerNode(publicKey);
		PeerNodeToNodeMapper.updateNodeFromPeerNode(node, peerNode, updateTime);

		assertEquals(node, peerNode);
	});

	function createPeerNode(publicKey: PublicKey) {
		const a = createDummyPublicKeyString();
		const b = createDummyPublicKeyString();
		const c = createDummyPublicKeyString();
		const quorumSet = new QuorumSetDTO(
			2,
			[a, b],
			[new QuorumSetDTO(1, [c], [])]
		);

		const peerNode = mock<PeerNode>();
		peerNode.publicKey = publicKey.value;
		peerNode.ip = 'localhost';
		peerNode.port = 11625;
		peerNode.quorumSetHash = 'key';
		peerNode.quorumSet = quorumSet;
		peerNode.isValidating = true;
		peerNode.isValidatingIncorrectValues = true;
		peerNode.overLoaded = true;
		peerNode.suppliedPeerList = true;
		peerNode.latestActiveSlotIndex = '1';
		peerNode.participatingInSCP = true;
		peerNode.successfullyConnected = true;
		peerNode.nodeInfo = {
			ledgerVersion: 3,
			overlayVersion: 2,
			versionString: 'v1.0.0',
			overlayMinVersion: 1
		};
		peerNode.getMinLagMS.mockReturnValue(5);

		return peerNode;
	}

	function assertEquals(node: Node, peerNode: PeerNode) {
		expect(node.ip).toEqual(peerNode.ip);
		expect(node.port).toEqual(peerNode.port);
		expect(node.publicKey.value).toEqual(peerNode.publicKey);
		expect(node.quorumSet?.hash).toEqual(peerNode.quorumSetHash);
		expect(node.quorumSet?.quorumSet).toEqual(peerNode.quorumSet);
		expect(node.latestMeasurement()).toBeInstanceOf(NodeMeasurement);
		expect(node.latestMeasurement()?.isValidating).toEqual(true);
		expect(node.latestMeasurement()?.isOverLoaded).toEqual(true);
		expect(node.latestMeasurement()?.isActiveInScp).toEqual(true);
		expect(node.latestMeasurement()?.isActive).toEqual(true);
		expect(node.latestMeasurement()?.lag).toEqual(5);
		expect(node.geoData).toBeNull();
		expect(node.details).toBeNull();
		expect(node.versionStr).toEqual('v1.0.0');
		expect(node.overlayVersion).toEqual(2);
		expect(node.ledgerVersion).toEqual(3);
		expect(node.overlayMinVersion).toEqual(1);
		expect(node.latestMeasurement()?.time).toEqual(node.snapshotStartDate);
		expect(node.latestMeasurement()?.connectivityError).toEqual(false);
	}

	test('should set isValidating and isActiveInScp to false when connection failed', () => {
		const time = new Date('2019-01-01T00:00:00.000Z');
		const publicKey = createDummyPublicKey();
		const node = Node.create(time, publicKey, {
			ip: 'localhost',
			port: 11625
		});

		const peerNode = mock<PeerNode>();
		peerNode.successfullyConnected = false;
		peerNode.isValidating = true; // Saw relayed messages
		peerNode.participatingInSCP = true;
		peerNode.overLoaded = false;
		peerNode.getMinLagMS.mockReturnValue(5);

		const measurement = PeerNodeToNodeMapper.mapPeerNodeToNodeMeasurement(
			peerNode,
			node,
			time
		);

		expect(measurement.connectivityError).toBe(true);
		expect(measurement.isValidating).toBe(false); // Should be false despite relayed messages
		expect(measurement.isActiveInScp).toBe(false);
		expect(measurement.isActive).toBe(false);
		expect(measurement.lag).toBe(null);
	});

	test('should set isValidating and isActiveInScp to true when successfully connected and validating', () => {
		const time = new Date('2019-01-01T00:00:00.000Z');
		const publicKey = createDummyPublicKey();
		const node = Node.create(time, publicKey, {
			ip: 'localhost',
			port: 11625
		});

		const peerNode = mock<PeerNode>();
		peerNode.successfullyConnected = true;
		peerNode.isValidating = true;
		peerNode.participatingInSCP = true;
		peerNode.overLoaded = false;
		peerNode.getMinLagMS.mockReturnValue(5);

		const measurement = PeerNodeToNodeMapper.mapPeerNodeToNodeMeasurement(
			peerNode,
			node,
			time
		);

		expect(measurement.connectivityError).toBe(false);
		expect(measurement.isValidating).toBe(true);
		expect(measurement.isActiveInScp).toBe(true);
		expect(measurement.isActive).toBe(true);
		expect(measurement.lag).toBe(5);
	});
});
