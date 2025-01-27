import { err, ok, Result } from 'neverthrow';
import { HistoryArchiveRepository } from '../../domain/HistoryArchiveRepository';
import { NetworkDTOService } from '../../../network-scan/services/NetworkDTOService';
import { injectable } from 'inversify';

/**
 * Repository implementation that fetches history archive URLs from the NetworkScan module.
 * Uses NetworkDTOService to access the network state and extract history archive URLs
 * from node configurations.
 */
@injectable()
export class NetworkScanHistoryArchiveRepository
	implements HistoryArchiveRepository
{
	constructor(private networkDTOService: NetworkDTOService) {}

	/**
	 * Retrieves all available history archive URLs from the network's node configurations
	 * by querying the NetworkScan module's latest network state.
	 */
	async getHistoryArchiveUrls(): Promise<Result<string[], Error>> {
		const networkResult = await this.networkDTOService.getLatestNetworkDTO();
		if (networkResult.isErr()) {
			return err(networkResult.error);
		}
		if (networkResult.value === null) {
			return ok([]);
		}

		const urls = networkResult.value.nodes
			.map((node) => node.historyUrl)
			.filter((url) => url !== null) as string[];

		return ok(urls);
	}
}
