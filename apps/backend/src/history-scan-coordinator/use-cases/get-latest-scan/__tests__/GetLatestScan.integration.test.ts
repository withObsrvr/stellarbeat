import Kernel from '../../../../core/infrastructure/Kernel';
import { ConfigMock } from '../../../../core/config/__mocks__/configMock';
import { TYPES } from '../../../infrastructure/di/di-types';
import { ScanRepository } from '../../../domain/scan/ScanRepository';
import { Scan } from '../../../domain/scan/Scan';
import { ScanError, ScanErrorType, ScanErrorCategory } from '../../../domain/scan/ScanError';
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

describe('scan with multiple verification errors', () => {
	it('should return scan with multiple errors of different categories', async function () {
		const historyArchiveScanRepository: ScanRepository = kernel.container.get(
			TYPES.HistoryArchiveScanRepository
		);
		const urlResult = Url.create('https://multi-error-test.com');
		if (urlResult.isErr()) throw new Error('Invalid url');
		const url = urlResult.value;

		const errors = [
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url.value,
				'100 transaction set hash mismatches (ledgers 1000 - 2000)',
				100,
				ScanErrorCategory.TRANSACTION_SET_HASH
			),
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url.value,
				'50 ledger header hash mismatches',
				50,
				ScanErrorCategory.LEDGER_HEADER_HASH
			),
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url.value,
				'25 bucket hash mismatches',
				25,
				ScanErrorCategory.BUCKET_HASH
			)
		];

		const scan = new Scan(
			new Date(),
			new Date(),
			new Date(),
			url,
			0,
			3000,
			1000,
			'hash123',
			10,
			false,
			errors
		);

		await historyArchiveScanRepository.save([scan]);

		const getLatestScan = kernel.container.get(GetLatestScan);
		const scanOrError = await getLatestScan.execute({
			url: url.value
		});

		expect(scanOrError.isOk()).toBeTruthy();
		if (!scanOrError.isOk()) return;

		expect(scanOrError.value).toBeInstanceOf(HistoryArchiveScan);
		expect(scanOrError.value?.hasError).toBe(true);
		expect(scanOrError.value?.errors).toHaveLength(3);

		// Verify error details are preserved
		const txSetError = scanOrError.value?.errors.find(
			(e) => e.category === 'TRANSACTION_SET_HASH'
		);
		expect(txSetError).toBeDefined();
		expect(txSetError?.count).toBe(100);
		expect(txSetError?.message).toContain('transaction set');

		const ledgerHeaderError = scanOrError.value?.errors.find(
			(e) => e.category === 'LEDGER_HEADER_HASH'
		);
		expect(ledgerHeaderError).toBeDefined();
		expect(ledgerHeaderError?.count).toBe(50);

		const bucketError = scanOrError.value?.errors.find(
			(e) => e.category === 'BUCKET_HASH'
		);
		expect(bucketError).toBeDefined();
		expect(bucketError?.count).toBe(25);
	});

	it('should aggregate error counts correctly', async function () {
		const historyArchiveScanRepository: ScanRepository = kernel.container.get(
			TYPES.HistoryArchiveScanRepository
		);
		const urlResult = Url.create('https://error-count-test.com');
		if (urlResult.isErr()) throw new Error('Invalid url');
		const url = urlResult.value;

		const errors = [
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url.value,
				'1000000 transaction set hash mismatches',
				1000000,
				ScanErrorCategory.TRANSACTION_SET_HASH
			)
		];

		const scan = new Scan(
			new Date(),
			new Date(),
			new Date(),
			url,
			0,
			null,
			0,
			null,
			1,
			false,
			errors
		);

		await historyArchiveScanRepository.save([scan]);

		const getLatestScan = kernel.container.get(GetLatestScan);
		const scanOrError = await getLatestScan.execute({
			url: url.value
		});

		expect(scanOrError.isOk()).toBeTruthy();
		if (!scanOrError.isOk()) return;

		expect(scanOrError.value?.errors).toHaveLength(1);
		expect(scanOrError.value?.errors[0].count).toBe(1000000);
		expect(scanOrError.value?.errors[0].category).toBe('TRANSACTION_SET_HASH');
	});

	it('should only return TYPE_VERIFICATION errors in the errors array', async function () {
		const historyArchiveScanRepository: ScanRepository = kernel.container.get(
			TYPES.HistoryArchiveScanRepository
		);
		const urlResult = Url.create('https://verification-only-test.com');
		if (urlResult.isErr()) throw new Error('Invalid url');
		const url = urlResult.value;

		const errors = [
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url.value,
				'Verification error',
				10,
				ScanErrorCategory.TRANSACTION_SET_HASH
			),
			new ScanError(
				ScanErrorType.TYPE_CONNECTION,
				url.value,
				'Connection timeout',
				1,
				ScanErrorCategory.CONNECTION
			)
		];

		const scan = new Scan(
			new Date(),
			new Date(),
			new Date(),
			url,
			0,
			null,
			0,
			null,
			1,
			false,
			errors
		);

		await historyArchiveScanRepository.save([scan]);

		const getLatestScan = kernel.container.get(GetLatestScan);
		const scanOrError = await getLatestScan.execute({
			url: url.value
		});

		expect(scanOrError.isOk()).toBeTruthy();
		if (!scanOrError.isOk()) return;

		// The GetLatestScan filters to only TYPE_VERIFICATION errors
		// Check that this filtering is working
		expect(scanOrError.value?.errors.length).toBeGreaterThan(0);
		scanOrError.value?.errors.forEach((error) => {
			// All returned errors should be verification errors
			expect(error.category).not.toBe('CONNECTION');
		});
	});
});
