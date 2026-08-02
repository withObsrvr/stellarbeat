import { inject, injectable, optional } from 'inversify';
import { NodeScan } from './NodeScan';
import { NodeTomlFetcher } from './NodeTomlFetcher';
import { EndpointCandidateManager } from '../endpoint/EndpointCandidateManager';
import { PeerNode } from 'crawler';
import { NodeRepository } from '../NodeRepository';
import { NETWORK_TYPES } from '../../../infrastructure/di/di-types';
import PublicKey from '../PublicKey';

@injectable()
export class NodeScannerTomlStep {
	constructor(
		private nodeTomlFetcher: NodeTomlFetcher,
		@optional() private endpointCandidateManager?: EndpointCandidateManager,
		@inject(NETWORK_TYPES.NodeRepository)
		@optional()
		private nodeRepository?: NodeRepository
	) {}

	public async execute(nodeScan: NodeScan): Promise<void> {
		const declarations = await this.nodeTomlFetcher.fetchNodeTomlInfoCollection(
			nodeScan.getHomeDomains()
		);
		nodeScan.updateWithTomlInfo(declarations);
		if (!this.endpointCandidateManager) return;

		const candidates =
			await this.endpointCandidateManager.reconcileTomlDeclarations(
				declarations
			);
		const attempts =
			await this.endpointCandidateManager.probePendingCandidates(candidates);
		if (attempts.length === 0) return;

		const peerNodes = attempts
			.filter((attempt) => attempt.remotePublicKey)
			.map((attempt) => {
				const peerNode = new PeerNode(attempt.remotePublicKey as string);
				peerNode.ip = attempt.ip;
				peerNode.port = attempt.port;
				peerNode.nodeInfo = attempt.nodeInfo;
				peerNode.successfullyConnected = true;
				return peerNode;
			});
		const newPublicKeys = peerNodes
			.filter(
				(peerNode) =>
					nodeScan.getNodeByPublicKeyString(peerNode.publicKey) === undefined
			)
			.map((peerNode) => PublicKey.create(peerNode.publicKey))
			.filter((publicKey) => publicKey.isOk())
			.map((publicKey) => publicKey.value);
		const archivedNodes =
			this.nodeRepository && newPublicKeys.length > 0
				? await this.nodeRepository.findByPublicKey(newPublicKeys)
				: [];
		nodeScan.processCrawl(
			peerNodes,
			archivedNodes,
			nodeScan.processedLedgers,
			nodeScan.latestLedger,
			nodeScan.latestLedgerCloseTime
		);
	}
}
