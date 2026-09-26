import { NodeScannerGeoStep } from '../NodeScannerGeoStep';
import { GeoDataService, GeoDataUpdateError } from '../GeoDataService';
import { mock } from 'jest-mock-extended';
import { Logger } from 'logger';
import { NodeScan } from '../NodeScan';
import { err, ok } from 'neverthrow';

describe('NodeScannerGeoStep', () => {
	const geoDataService = mock<GeoDataService>();
	const geoStep = new NodeScannerGeoStep(geoDataService, mock<Logger>());

	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('should not update geo-data when nothing needs it', function () {
		const nodeScan = mock<NodeScan>();
		nodeScan.getIPsNeedingGeoData.mockReturnValue([]);
		geoStep.execute(nodeScan);
		expect(geoDataService.fetchGeoData).not.toHaveBeenCalled();
	});

	it('should update geo-data for a node that needs it', async function () {
		const nodeScan = mock<NodeScan>();
		nodeScan.getIPsNeedingGeoData.mockReturnValue(['localhost']);
		geoDataService.fetchGeoData.mockResolvedValue(
			ok({
				latitude: 1,
				longitude: 1,
				countryName: 'country',
				countryCode: 'countryCode',
				isp: 'isp'
			})
		);
		await geoStep.execute(nodeScan);
		expect(nodeScan.updateGeoDataAndISP).toBeCalled();
	});

	it('should not update geo-data when the geo-data service failed', async function () {
		const nodeScan = mock<NodeScan>();
		nodeScan.getIPsNeedingGeoData.mockReturnValue(['localhost']);
		geoDataService.fetchGeoData.mockResolvedValue(
			err(new GeoDataUpdateError('test'))
		);
		await geoStep.execute(nodeScan);
		expect(nodeScan.updateGeoDataAndISP).not.toBeCalled();
		expect(geoDataService.fetchGeoData).toBeCalled();
	});
});

describe('NodeScannerGeoStep retries', () => {
	/**
	 * The step used to ask only for IPs that changed, so a lookup that failed
	 * was never attempted again and the node stayed without a country or ISP
	 * indefinitely.
	 */
	it('asks for every IP needing geo data, not just changed ones', async () => {
		const geoDataService = mock<GeoDataService>();
		const geoStep = new NodeScannerGeoStep(geoDataService, mock<Logger>());
		const nodeScan = mock<NodeScan>();

		nodeScan.getIPsNeedingGeoData.mockReturnValue(['1.1.1.1', '2.2.2.2']);
		geoDataService.fetchGeoData.mockResolvedValue(
			ok({
				latitude: 1,
				longitude: 1,
				countryName: 'country',
				countryCode: 'countryCode',
				isp: 'isp'
			})
		);

		await geoStep.execute(nodeScan);

		expect(geoDataService.fetchGeoData).toHaveBeenCalledTimes(2);
		expect(nodeScan.getIPsNeedingGeoData).toHaveBeenCalled();
	});
});
