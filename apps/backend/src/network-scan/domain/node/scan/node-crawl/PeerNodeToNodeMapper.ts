import Node from '../../Node';
import { PeerNode } from 'crawler';
import NodeQuorumSet from '../../NodeQuorumSet';
import PublicKey from '../../PublicKey';
import NodeMeasurement from '../../NodeMeasurement';
import { err, ok, Result } from 'neverthrow';
export class InvalidPeerNode {
	constructor(
		public publicKey: string,
		public reason: string
	) {}
}

export class PeerNodeToNodeMapper {
	static updateNodeFromPeerNode(node: Node, peerNode: PeerNode, time: Date) {
		PeerNodeToNodeMapper.updateNodeIdentityFromPeerNode(node, peerNode, time);

		const measurement = PeerNodeToNodeMapper.mapPeerNodeToNodeMeasurement(
			peerNode,
			node,
			time
		);

		node.addMeasurement(measurement);
	}

	/**
	 * Apply facts established by an authenticated overlay connection without
	 * inventing SCP evidence. Endpoint probes complete after the main crawl and
	 * do not listen for externalize statements, so using the full mapper for
	 * them used to replace a validator's real measurement with
	 * `isValidating=false` at the same scan timestamp.
	 */
	static updateNodeIdentityFromPeerNode(
		node: Node,
		peerNode: PeerNode,
		time: Date
	) {
		if (peerNode.ip && peerNode.port) {
			if (peerNode.successfullyConnected)
				node.updateAuthenticatedIpPort(peerNode.ip, peerNode.port, time);
			else node.updateIpPort(peerNode.ip, peerNode.port, time);
		}

		if (peerNode.quorumSetHash && peerNode.quorumSet) {
			const quorumSet = NodeQuorumSet.create(
				peerNode.quorumSetHash,
				peerNode.quorumSet
			);
			node.updateQuorumSet(quorumSet, time);
		}

		if (
			peerNode.nodeInfo?.overlayVersion &&
			peerNode.nodeInfo.overlayMinVersion &&
			peerNode.nodeInfo.overlayVersion &&
			peerNode.nodeInfo?.versionString
		) {
			node.updateLedgerVersion(peerNode.nodeInfo?.ledgerVersion, time);
			node.updateOverlayVersion(peerNode.nodeInfo?.overlayVersion, time);
			node.updateOverlayMinVersion(peerNode.nodeInfo?.overlayMinVersion, time);
			node.updateVersionStr(peerNode.nodeInfo?.versionString, time);
		}

	}

	static createNodeFromPeerNode(
		peerNode: PeerNode,
		time: Date
	): Result<Node, InvalidPeerNode> {
		const publicKeyOrError = PublicKey.create(peerNode.publicKey);
		if (publicKeyOrError.isErr()) {
			return err(
				new InvalidPeerNode(peerNode.publicKey, publicKeyOrError.error.message)
			);
		}

		if (peerNode.ip === undefined || peerNode.port === undefined)
			return err(
				new InvalidPeerNode(peerNode.publicKey, 'PeerNode has no ip or port')
			);

		const node = Node.create(time, publicKeyOrError.value, {
			ip: peerNode.ip,
			port: peerNode.port
		});

		PeerNodeToNodeMapper.updateNodeFromPeerNode(node, peerNode, time);

		return ok(node);
	}

	static mapPeerNodeToNodeMeasurement(
		peerNode: PeerNode,
		node: Node,
		time: Date
	): NodeMeasurement {
		const measurement = new NodeMeasurement(time, node);
		measurement.isActive = peerNode.successfullyConnected;
		measurement.connectivityError = peerNode.successfullyConnected === false;
		// Trust validating status from both direct connection and relayed SCP messages
		// (relayed messages are cryptographically signed by the originating node)
		// Use connectivityError to distinguish: isValidating && connectivityError = relayed only
		measurement.isValidating = peerNode.isValidating;
		measurement.isOverLoaded = peerNode.overLoaded;
		measurement.isActiveInScp =
			peerNode.successfullyConnected && peerNode.participatingInSCP;
		measurement.lag = peerNode.successfullyConnected
			? (peerNode.getMinLagMS() ?? null)
			: null;

		return measurement;
	}
}
