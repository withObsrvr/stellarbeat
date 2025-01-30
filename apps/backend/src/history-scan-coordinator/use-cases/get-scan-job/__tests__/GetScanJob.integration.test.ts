import { mock } from 'jest-mock-extended';
import { ok } from 'neverthrow';
import { GetScanJob } from '../GetScanJob';
import { HistoryArchiveRepository } from '../../../domain/HistoryArchiveRepository';
import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { TYPES } from '../../../infrastructure/di/di-types';
import { Scan } from '../../../domain/scan/Scan';
import { Url } from 'http-helper';
import { ScanRepository } from '../../../domain/scan/ScanRepository';

describe('GetScanJobs.integration', () => {
	let kernel: Kernel;
	let getScanJob: GetScanJob;
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

		getScanJob = kernel.container.get<GetScanJob>(GetScanJob);
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

		const nextScanJobResult = await getScanJob.execute();

		expect(nextScanJobResult.isOk()).toBe(true);
		const nextScan = nextScanJobResult._unsafeUnwrap();

		expect(nextScan).toBeDefined();

		expect(nextScan?.url).toBe(url2.value.value);
		expect(nextScan?.chainInitDate).toBe(null);
		expect(nextScan?.latestScannedLedger).toBe(0);
		expect(nextScan?.latestScannedLedgerHeaderHash).toBe(null);

		const nextNextScanJobResult = await getScanJob.execute();
		expect(nextNextScanJobResult.isOk()).toBe(true);
		const nextNextScan = nextNextScanJobResult._unsafeUnwrap();

		expect(nextNextScan).toBeDefined();
		expect(nextNextScan?.url).toBe(url1.value.value);
		expect(nextNextScan?.chainInitDate).toEqual(new Date('2021-01-01'));
		expect(nextNextScan?.latestScannedLedger).toBe(100);
		expect(nextNextScan?.latestScannedLedgerHeaderHash).toBe('hash');

		expect(
			historyArchiveRepository.getHistoryArchiveUrls
		).toHaveBeenCalledTimes(1);
	});

	it('should handle empty history archive list', async () => {
		historyArchiveRepository.getHistoryArchiveUrls.mockResolvedValue(ok([]));

		const result = await getScanJob.execute();

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) throw result.error;
		expect(result.value).toBeNull();
	});
});
