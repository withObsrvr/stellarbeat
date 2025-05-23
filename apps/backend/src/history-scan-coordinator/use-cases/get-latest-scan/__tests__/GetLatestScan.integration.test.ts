import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { TYPES } from '../../../infrastructure/di/di-types';
import { ScanRepository } from '../../../domain/scan/ScanRepository';
import { Scan } from '../../../domain/scan/Scan';
import { GetLatestScan } from '../GetLatestScan';
import { HistoryArchiveScan } from 'shared';
import { InvalidUrlError } from '../InvalidUrlError';
import { Url } from 'http-helper';

let kernel: Kernel;
jest.setTimeout(60000); //slow integration tests
beforeAll(async () => {
	kernel = await Kernel.getInstance(new ConfigMock());
});

afterAll(async () => {
	await kernel.close();
});

it('fetch latest archive', async function () {
	const historyArchiveScanRepository: ScanRepository = kernel.container.get(
		TYPES.HistoryArchiveScanRepository
	);
	const urlResult = Url.create('https://test.com');
	if (urlResult.isErr()) throw new Error('Invalid url');
	const url = urlResult.value;
	await historyArchiveScanRepository.save([
		new Scan(new Date(), new Date(), new Date(), url, 0, null)
	]);
	const getLatestScan = kernel.container.get(GetLatestScan);
	const scanOrError = await getLatestScan.execute({
		url: url.value
	});

	expect(scanOrError.isOk()).toBeTruthy();
	if (!scanOrError.isOk()) return;
	expect(scanOrError.value).toBeInstanceOf(HistoryArchiveScan);
	if (!scanOrError.value) return;
	expect(scanOrError.value.url).toEqual(url.value);
});

it('should return InvalidUrl', async function () {
	const getLatestScan = kernel.container.get(GetLatestScan);
	const scanOrError = await getLatestScan.execute({
		url: 'archiveorg'
	});

	expect(scanOrError.isErr()).toBeTruthy();
	if (!scanOrError.isErr()) return;
	expect(scanOrError.error).toBeInstanceOf(InvalidUrlError);
});
