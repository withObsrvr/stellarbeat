import { RESTScanCoordinatorService } from '../RESTScanCoordinatorService';
import { HttpService, Url } from 'http-helper';
import { mock } from 'jest-mock-extended';
import { ok } from 'neverthrow';
import { Scan } from '../../../domain/scan/Scan';

describe('RESTScanCoordinatorService Integration Tests', () => {
	let httpService: jest.Mocked<HttpService>;
	let service: RESTScanCoordinatorService;
	const baseUrl = 'http://home.com';
	const username = 'admin';
	const secret = 'test-secret';

	beforeEach(() => {
		httpService = mock<HttpService>();
		service = new RESTScanCoordinatorService(
			httpService,
			baseUrl,
			username,
			secret
		);
	});

	describe('registerScan', () => {
		const url = Url.create('https://history.stellar.org');
		it('should successfully register scan result', async () => {
			const scan = new Scan(
				new Date(),
				new Date(),
				new Date(),
				url._unsafeUnwrap(),
				1,
				100,
				90,
				'hash123',
				5,
				false,
				null,
				'remote-id'
			);

			httpService.post.mockResolvedValue(
				ok({
					status: 201,
					statusText: 'Created',
					headers: {},
					data: { message: 'Scan created successfully' }
				})
			);

			const result = await service.registerScan(scan);
			expect(result.isOk()).toBe(true);

			expect(httpService.post).toBeCalledTimes(1);
		});
	});

	describe('getScanJobs', () => {
		it('should successfully get pending scan jobs', async () => {
			const initDate = new Date();
			const mockJob = {
				url: 'https://history.stellar.org',
				latestScannedLedger: 100,
				latestScannedLedgerHeaderHash: 'hash123',
				chainInitDate: initDate.toISOString(),
				remoteId: 'remote-id'
			};

			httpService.get.mockResolvedValue(
				ok({
					status: 200,
					data: mockJob,
					headers: {},
					statusText: 'OK'
				})
			);

			const result = await service.getScanJob();
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value).toEqual({
					url: 'https://history.stellar.org',
					latestScannedLedger: 100,
					latestScannedLedgerHeaderHash: 'hash123',
					chainInitDate: initDate,
					remoteId: 'remote-id'
				});
			}
		});
	});
});
