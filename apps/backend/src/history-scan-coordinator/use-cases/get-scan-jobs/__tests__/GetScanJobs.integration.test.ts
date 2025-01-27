import { mock } from 'jest-mock-extended';
import { ok } from 'neverthrow';
import { GetScanJobs } from '../GetScanJobs';
import { HistoryArchiveRepository } from '../../../domain/HistoryArchiveRepository';
import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { TYPES } from '../../../infrastructure/di/di-types';
import { Scan } from '../../../domain/scan/Scan';
import { Url } from 'http-helper';
import { ScanRepository } from '../../../domain/scan/ScanRepository';

describe('GetScanJobs.integration', () => {
	let kernel: Kernel;
	let getScanJobs: GetScanJobs;
	let historyArchiveRepository: jest.Mocked<HistoryArchiveRepository>;
	let scanRepository: ScanRepository;

	jest.setTimeout(60000); //slow integration tests

	beforeAll(async () => {
		kernel = await Kernel.getInstance(new ConfigMock());
	});

	afterAll(async () => {
		await kernel.close();
	});

	beforeEach(() => {
		// Create mock repository, we don't want to test other module
		historyArchiveRepository = mock<HistoryArchiveRepository>();
		// Rebind the repository in the container to use our mock
		kernel.container
			.rebind(TYPES.HistoryArchiveRepository)
			.toConstantValue(historyArchiveRepository);

		getScanJobs = kernel.container.get<GetScanJobs>(GetScanJobs);
		scanRepository = kernel.container.get<ScanRepository>(
			TYPES.HistoryArchiveScanRepository
		);
	});

	it('should get scan jobs from available history archives', async () => {
		const url1 = Url.create('https://history1.stellar.org');
		if (url1.isErr()) throw url1.error;
		const url2 = Url.create('https://history2.stellar.org');
		if (url2.isErr()) throw url2.error;

		historyArchiveRepository.getHistoryArchiveUrls.mockResolvedValue(
			ok([url1.value.value, url2.value.value])
		);

		const previousScan = new Scan(
			new Date('2021-01-01'),
			new Date('2021-01-02'),
			new Date('2021-01-03'),
			url1.value,
			1,
			100,
			100,
			'hash',
			100,
			false,
			null
		);
		await scanRepository.save([previousScan]);

		const result = await getScanJobs.execute();

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) throw result.error;

		expect(result.value.length).toBe(2);
		expect(result.value[0].url).toBe(url2.value.value);
		expect(result.value[0].chainInitDate).toBe(null);
		expect(result.value[0].latestScannedLedger).toBe(0);
		expect(result.value[0].latestScannedLedgerHeaderHash).toBe(null);
		expect(result.value[1].url).toBe(url1.value.value);
		expect(result.value[1].chainInitDate).toEqual(new Date('2021-01-01'));
		expect(result.value[1].latestScannedLedger).toBe(100);
		expect(result.value[1].latestScannedLedgerHeaderHash).toBe('hash');
		expect(
			historyArchiveRepository.getHistoryArchiveUrls
		).toHaveBeenCalledTimes(1);
	});

	it('should handle empty history archive list', async () => {
		historyArchiveRepository.getHistoryArchiveUrls.mockResolvedValue(ok([]));

		const result = await getScanJobs.execute();

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) throw result.error;
		expect(result.value).toEqual([]);
	});
});
