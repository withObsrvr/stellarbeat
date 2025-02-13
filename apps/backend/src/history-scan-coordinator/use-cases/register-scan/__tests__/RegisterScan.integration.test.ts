import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { TYPES } from '../../../infrastructure/di/di-types';
import { RegisterScan } from '../../../use-cases/register-scan/RegisterScan';
import { ScanRepository } from '../../../domain/scan/ScanRepository';
import { Url } from 'http-helper';
import { ScanDTO } from 'history-scanner-dto';
import { ScanJobRepository } from '../../../domain/ScanJobRepository';
import { ScanJob } from '../../../domain/ScanJob';
import { url } from 'inspector';

describe('RegisterScan.integration', () => {
	let kernel: Kernel;
	let registerScan: RegisterScan;
	let scanRepository: ScanRepository;
	let scanJobRepository: ScanJobRepository;

	beforeAll(async () => {
		kernel = await Kernel.getInstance(new ConfigMock());
		registerScan = kernel.container.get(RegisterScan);
		scanRepository = kernel.container.get<ScanRepository>(
			TYPES.HistoryArchiveScanRepository
		);
		scanJobRepository = kernel.container.get<ScanJobRepository>(
			TYPES.ScanJobRepository
		);
	});

	afterAll(async () => {
		await kernel.close();
	});

	it('should register a new scan successfully', async () => {
		const urlResult = Url.create('http://example.com');
		const scanJob = new ScanJob(urlResult._unsafeUnwrap().value);
		await scanJobRepository.save([scanJob]);

		if (urlResult.isErr()) throw urlResult.error;

		const dto: ScanDTO = {
			startDate: new Date(),
			endDate: new Date(),
			fromLedger: 1,
			toLedger: 100,
			error: {
				type: 'TYPE_VERIFICATION',
				message: 'Invalid URL',
				url: 'http://example.com/error'
			},
			baseUrl: urlResult.value.value,
			scanChainInitDate: new Date(),
			latestVerifiedLedger: 100,
			latestScannedLedger: 100,
			latestScannedLedgerHeaderHash: null,
			concurrency: 5,
			isSlowArchive: false,
			scanJobRemoteId: scanJob.remoteId
		};

		const result = await registerScan.execute(dto);
		expect(result.isOk()).toBe(true);

		if (result.isOk()) {
			// Confirm persisted
			const scanInDb =
				await scanRepository.findLatestByUrl('http://example.com');
			expect(scanInDb).toBeDefined();
			expect(scanInDb?.baseUrl.value).toBe('http://example.com');

			const job = await scanJobRepository.findByRemoteId(scanJob.remoteId);
			expect(job).toBeDefined();
			expect(job?.status).toBe('DONE');
		}
	});
});
