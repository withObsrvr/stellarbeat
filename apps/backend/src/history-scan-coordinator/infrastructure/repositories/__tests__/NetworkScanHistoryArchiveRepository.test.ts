import { NetworkScanHistoryArchiveRepository } from '../NetworkScanHistoryArchiveRepository';
import { NetworkDTOService } from '../../../../network-scan/services/NetworkDTOService';
import { mock } from 'jest-mock-extended';
import { err, ok } from 'neverthrow';
import { createDummyNodeV1 } from '../../../../network-scan/services/__fixtures__/createDummyNodeV1';
import { createDummyNetworkV1 } from '../../../../network-scan/services/__fixtures__/createDummyNetworkV1';

describe('NetworkScanHistoryArchiveRepository', () => {
	let networkDTOService: jest.Mocked<NetworkDTOService>;
	let repository: NetworkScanHistoryArchiveRepository;

	beforeEach(() => {
		networkDTOService = mock<NetworkDTOService>();
		repository = new NetworkScanHistoryArchiveRepository(networkDTOService);
	});

	describe('getHistoryArchiveUrls', () => {
		it('should return history archive urls from network nodes', async () => {
			// Set up test data
			const nodeA = createDummyNodeV1();
			nodeA.historyUrl =
				'https://history.stellar.org/prd/core-live/core_live_001';
			const nodeB = createDummyNodeV1();
			nodeB.historyUrl =
				'https://history.stellar.org/prd/core-live/core_live_002';
			const nodeC = createDummyNodeV1();
			nodeC.historyUrl = null; // Node without history URL

			const network = createDummyNetworkV1([nodeA, nodeB, nodeC]);
			networkDTOService.getLatestNetworkDTO.mockResolvedValue(ok(network));

			// Execute
			const result = await repository.getHistoryArchiveUrls();

			// Verify
			expect(result.isOk()).toBe(true);
			if (!result.isOk()) throw result.error;
			expect(result.value).toEqual([nodeA.historyUrl, nodeB.historyUrl]);
		});

		it('should return error when NetworkDTOService fails', async () => {
			const error = new Error('Network error');
			networkDTOService.getLatestNetworkDTO.mockResolvedValue(err(error));

			const result = await repository.getHistoryArchiveUrls();

			expect(result.isErr()).toBe(true);
			if (!result.isErr()) throw new Error('Expected error');
			expect(result.error).toBe(error);
		});

		it('should return no urls when no network found', async () => {
			networkDTOService.getLatestNetworkDTO.mockResolvedValue(ok(null));

			const result = await repository.getHistoryArchiveUrls();

			expect(result.isOk()).toBe(true);
			if (result.isErr()) throw new Error('UnExpected error');

			expect(result.value).toHaveLength(0);
		});

		it('should return empty array when no nodes have history urls', async () => {
			const nodeA = createDummyNodeV1();
			nodeA.historyUrl = null;
			const network = createDummyNetworkV1([nodeA]);
			networkDTOService.getLatestNetworkDTO.mockResolvedValue(ok(network));

			const result = await repository.getHistoryArchiveUrls();

			expect(result.isOk()).toBe(true);
			if (!result.isOk()) throw result.error;
			expect(result.value).toEqual([]);
		});
	});
});
