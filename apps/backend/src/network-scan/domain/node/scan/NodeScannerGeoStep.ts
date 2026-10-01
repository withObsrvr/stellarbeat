import { inject, injectable } from 'inversify';
import { GeoDataService } from './GeoDataService';
import { Logger } from '../../../../core/services/Logger';
import NodeGeoDataLocation from '../NodeGeoDataLocation';
import { NodeScan } from './NodeScan';

@injectable()
export class NodeScannerGeoStep {
	constructor(
		@inject('GeoDataService')
		private geoDataService: GeoDataService,
		@inject('Logger')
		private logger: Logger
	) {}

	public async execute(nodeScan: NodeScan): Promise<void> {
		const ipsNeedingGeoData = nodeScan.getIPsNeedingGeoData();

		if (ipsNeedingGeoData.length > 0) {
			this.logger.info('Updating geoData info for', {
				count: ipsNeedingGeoData.length
			});

			const ipMap = new Map<
				string,
				{
					geo: NodeGeoDataLocation;
					isp: string | null;
				}
			>();
			await Promise.all(
				ipsNeedingGeoData.map(async (ip: string) => {
					const result = await this.geoDataService.fetchGeoData(ip);
					if (result.isErr()) this.logger.info(result.error.message);
					else {
						ipMap.set(ip, {
							geo: NodeGeoDataLocation.create({
								latitude: result.value.latitude,
								longitude: result.value.longitude,
								countryName: result.value.countryName,
								countryCode: result.value.countryCode
							}),
							isp: result.value.isp
						});
					}
				})
			);
			if (ipMap.size < ipsNeedingGeoData.length) {
				//Surfaced rather than counted silently: a provider that is down
				//or a bad key shows up here as every lookup failing, and the
				//consequence lands two steps later in the country and ISP
				//analysis rather than anywhere obviously geo-related.
				this.logger.warn('Geo data lookups failed', {
					failed: ipsNeedingGeoData.length - ipMap.size,
					requested: ipsNeedingGeoData.length
				});
			}

			if (ipMap.size > 0) nodeScan.updateGeoDataAndISP(ipMap);
		}
	}
}
