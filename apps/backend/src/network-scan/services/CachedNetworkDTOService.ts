import { NetworkDTOService } from './NetworkDTOService';
import { inject, injectable } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import LRUCache from 'lru-cache';
import { NetworkV1 } from 'shared';
import { mapUnknownToError } from '../../core/utilities/mapUnknownToError';
import { NETWORK_TYPES } from '../infrastructure/di/di-types';
import { NetworkScanRepository } from '../domain/network/scan/NetworkScanRepository';

@injectable()
export class CachedNetworkDTOService {
	private cache: LRUCache<string, NetworkV1>; //todo: external cache like redis ?
	constructor(
		private networkDTORepository: NetworkDTOService,
		@inject(NETWORK_TYPES.NetworkScanRepository)
		private networkScanRepository: NetworkScanRepository
	) {
		this.cache = new LRUCache<string, NetworkV1>({
			ttl: 1000 * 60 * 10, //10 minutes
			maxSize: 10, //max 10 items
			sizeCalculation: () => {
				return 1;
			}
		});
	}

	public async getLatestNetworkDTO(): Promise<Result<NetworkV1 | null, Error>> {
		try {
			console.log('Debug: CachedNetworkDTOService.getLatestNetworkDTO called');
			const scanTime = await this.networkScanRepository.findLatestSuccessfulScanTime();
			console.log('Debug: Latest successful scan time:', scanTime);

			if (!scanTime) {
				console.log('Debug: No scan time found');
				return ok(null);
			}

			if (this.cache.has(scanTime.toISOString())) {
				console.log('Debug: Found network in cache');
				return ok(this.cache.get(scanTime.toISOString()) as NetworkV1);
			}

			console.log('Debug: Getting latest network DTO from repository');
			const latestNetworkDTO = await this.networkDTORepository.getLatestNetworkDTO();
			if (latestNetworkDTO.isErr()) {
				console.log('Debug: Error getting latest network DTO:', latestNetworkDTO.error);
				return latestNetworkDTO;
			}

			if (latestNetworkDTO.value !== null) {
				console.log('Debug: Caching network DTO');
				this.cache.set(scanTime.toISOString(), latestNetworkDTO.value);
			} else {
				console.log('Debug: Latest network DTO is null');
			}

			return latestNetworkDTO;
		} catch (e) {
			console.log('Debug: Error in getLatestNetworkDTO:', e);
			return err(mapUnknownToError(e));
		}
	}

	public async getNetworkDTOAt(time: Date) {
		//at the moment no caching needed
		return this.networkDTORepository.getNetworkDTOAt(time);
	}
}
