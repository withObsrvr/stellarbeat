import { mock } from 'jest-mock-extended';
import { NodeScannerTomlStep } from '../NodeScannerTomlStep';
import { NodeScan } from '../NodeScan';
import { NodeTomlInfo } from '../NodeTomlInfo';
import { NodeTomlFetcher } from '../NodeTomlFetcher';
import { EndpointCandidateManager } from '../../endpoint/EndpointCandidateManager';
import { NodeRepository } from '../../NodeRepository';
import ValidatorEndpointCandidate from '../../endpoint/ValidatorEndpointCandidate';

describe('NodeScannerTomlStep', () => {
	const nodeTomlFetcher = mock<NodeTomlFetcher>();
	const step = new NodeScannerTomlStep(nodeTomlFetcher);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update with toml info', async function () {
		const nodeScan = mock<NodeScan>();
		const tomlInfo = new Set<NodeTomlInfo>();
		nodeTomlFetcher.fetchNodeTomlInfoCollection.mockResolvedValue(tomlInfo);
		await step.execute(nodeScan);
		expect(nodeTomlFetcher.fetchNodeTomlInfoCollection).toBeCalled();
		expect(nodeScan.updateWithTomlInfo).toBeCalledWith(tomlInfo);
	});

	it('probes new TOML endpoints and folds authenticated peers into the scan', async () => {
		const endpointCandidateManager = mock<EndpointCandidateManager>();
		const nodeRepository = mock<NodeRepository>();
		const deltaStep = new NodeScannerTomlStep(
			nodeTomlFetcher,
			endpointCandidateManager,
			nodeRepository
		);
		const nodeScan = mock<NodeScan>();
		const tomlInfo = new Set<NodeTomlInfo>();
		const candidate = ValidatorEndpointCandidate.create({
			networkId: 'public',
			ip: '20.187.166.130',
			port: 11625,
			source: 'toml_declaration'
		});
		const completedAt = new Date('2026-07-29T20:25:13Z');
		nodeTomlFetcher.fetchNodeTomlInfoCollection.mockResolvedValue(tomlInfo);
		endpointCandidateManager.reconcileTomlDeclarations.mockResolvedValue([
			candidate
		]);
		endpointCandidateManager.probePendingCandidates.mockResolvedValue([
			{
				address: '20.187.166.130:11625',
				ip: '20.187.166.130',
				port: 11625,
				attemptedAt: completedAt,
				completedAt,
				outcome: 'authenticated',
				remotePublicKey:
					'GBIRQBUX7DROBWBJ2X5BB2UQEDJSGCKJ3JPYJZOG2FRCNNJHFPUJANFJ'
			}
		]);
		nodeRepository.findByPublicKey.mockResolvedValue([]);

		await deltaStep.execute(nodeScan);

		expect(endpointCandidateManager.reconcileTomlDeclarations).toBeCalledWith(
			tomlInfo
		);
		expect(endpointCandidateManager.probePendingCandidates).toBeCalledWith([
			candidate
		]);
		expect(nodeRepository.findByPublicKey).toHaveBeenCalledTimes(1);
		expect(nodeScan.processCrawl).toHaveBeenCalledWith(
			[
				expect.objectContaining({
					ip: '20.187.166.130',
					successfullyConnected: true
				})
			],
			[],
			nodeScan.processedLedgers,
			nodeScan.latestLedger,
			nodeScan.latestLedgerCloseTime
		);
	});
});
