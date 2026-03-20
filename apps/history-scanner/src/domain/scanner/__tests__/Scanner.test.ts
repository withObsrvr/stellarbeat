import 'reflect-metadata';
import { Scanner } from '../Scanner';
import { mock } from 'jest-mock-extended';
import { createDummyHistoryBaseUrl } from '../../history-archive/__fixtures__/HistoryBaseUrl';
import { err, ok } from 'neverthrow';
import { ArchivistRangeScanner } from '../ArchivistRangeScanner';
import { RangeScanner } from '../RangeScanner';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../../scan/ScanError';
import { ScanJob } from '../../scan/ScanJob';
import { ScanSettingsFactory } from '../../scan/ScanSettingsFactory';
import { CategoryScanner } from '../CategoryScanner';
import { ArchivePerformanceTester } from '../ArchivePerformanceTester';
import { Logger } from 'logger';
import { ExceptionLogger } from 'exception-logger';

it('should scan', async function () {
	const rangeScanner = mock<ArchivistRangeScanner>();
	rangeScanner.scan.mockResolvedValue(
		ok({
			latestLedgerHeader: { ledger: 200, hash: 'ledger_hash' },
			errors: [],
			exitCode: 0
		})
	);

	const scanner = getScanner(rangeScanner);
	const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);
	const scan = await scanner.perform(new Date(), scanJob);
	expect(scan.latestScannedLedgerHeaderHash).toEqual('ledger_hash');
	expect(scan.latestScannedLedger).toEqual(200);

	expect(rangeScanner.scan).toHaveBeenCalledTimes(2); //two chunks
	expect(rangeScanner.scan).toHaveBeenLastCalledWith(
		{ value: 'https://history0.stellar.org' },
		100,
		200
	);
});

it('should not update latestScannedLedger in case of error', async () => {
	jest.useFakeTimers();

	const rangeScanner = mock<ArchivistRangeScanner>();
	rangeScanner.scan.mockResolvedValue(
		err(new ScanError(ScanErrorType.TYPE_CONNECTION, 'url', 'message'))
	);
	const scanner = getScanner(rangeScanner);

	const archiveUrl = createDummyHistoryBaseUrl();
	const scanJob = ScanJob.newScanChain(archiveUrl, 0, 200, 1);
	const scanPromise = scanner.perform(new Date(), scanJob);

	// Advance through retry delays
	await jest.advanceTimersByTimeAsync(30000);
	await jest.advanceTimersByTimeAsync(60000);
	await jest.advanceTimersByTimeAsync(120000);

	const scan = await scanPromise;

	expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_CONNECTION);
	// After aggregation, errors use the archive URL instead of individual file URLs
	expect(scan.errors[0]?.url).toEqual(archiveUrl.value);
	expect(scan.latestScannedLedger).toEqual(0);
	expect(scan.latestScannedLedgerHeaderHash).toEqual(null);

	jest.useRealTimers();
});

it('should collect verification errors from successful scans', async () => {
	const rangeScanner = mock<ArchivistRangeScanner>();
	const verificationError = new ScanError(
		ScanErrorType.TYPE_VERIFICATION,
		'https://example.com/ledger',
		'Wrong ledger hash'
	);
	rangeScanner.scan.mockResolvedValue(
		ok({
			latestLedgerHeader: { ledger: 200 },
			errors: [verificationError],
			exitCode: 1
		})
	);

	const scanner = getScanner(rangeScanner);
	const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);
	const scan = await scanner.perform(new Date(), scanJob);

	expect(scan.errors.length).toBeGreaterThan(0);
	expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_VERIFICATION);
	expect(scan.latestScannedLedger).toEqual(200);
});

describe('connection error handling', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should retry on exit code 2 and succeed after recovery', async () => {
		const rangeScanner = mock<ArchivistRangeScanner>();

		// First call fails with exit code 2 (connection error)
		// Second call (after retry) succeeds
		rangeScanner.scan
			.mockResolvedValueOnce(
				ok({
					latestLedgerHeader: { ledger: 100 },
					errors: [],
					exitCode: 2
				})
			)
			.mockResolvedValueOnce(
				ok({
					latestLedgerHeader: { ledger: 100 },
					errors: [],
					exitCode: 0
				})
			)
			.mockResolvedValue(
				ok({
					latestLedgerHeader: { ledger: 200 },
					errors: [],
					exitCode: 0
				})
			);

		const scanner = getScanner(rangeScanner);
		const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);

		const scanPromise = scanner.perform(new Date(), scanJob);

		// Advance through retry delay
		await jest.advanceTimersByTimeAsync(30000);

		const scan = await scanPromise;

		expect(scan.latestScannedLedger).toEqual(200);
		expect(scan.errors).toHaveLength(0);
		// Initial call + 1 retry + second chunk = 3+ calls
		expect(rangeScanner.scan).toHaveBeenCalledTimes(3);
	});

	it('should abort scan after max retries on persistent connection error', async () => {
		const rangeScanner = mock<ArchivistRangeScanner>();

		// Always return exit code 2 (connection error)
		rangeScanner.scan.mockResolvedValue(
			ok({
				latestLedgerHeader: { ledger: 100 },
				errors: [],
				exitCode: 2
			})
		);

		const scanner = getScanner(rangeScanner);
		const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);

		const scanPromise = scanner.perform(new Date(), scanJob);

		// Advance through all retry delays (30s, 60s, 120s) + final attempt
		await jest.advanceTimersByTimeAsync(30000);
		await jest.advanceTimersByTimeAsync(60000);
		await jest.advanceTimersByTimeAsync(120000);

		const scan = await scanPromise;

		// Should have connection error
		expect(scan.errors).toHaveLength(1);
		expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_CONNECTION);
		expect(scan.errors[0]?.category).toEqual(ScanErrorCategory.CONNECTION);
		expect(scan.errors[0]?.message).toContain('Scan aborted');
		// Initial call + 3 retries + final check = 5 calls
		expect(rangeScanner.scan).toHaveBeenCalledTimes(5);
	});

	it('should not retry on exit code 1 (verification error)', async () => {
		const rangeScanner = mock<ArchivistRangeScanner>();
		const verificationError = new ScanError(
			ScanErrorType.TYPE_VERIFICATION,
			'https://example.com/ledger',
			'Hash mismatch'
		);

		// Exit code 1 means verification error (not connection error)
		rangeScanner.scan.mockResolvedValue(
			ok({
				latestLedgerHeader: { ledger: 200 },
				errors: [verificationError],
				exitCode: 1
			})
		);

		const scanner = getScanner(rangeScanner);
		const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);

		const scan = await scanner.perform(new Date(), scanJob);

		// Should have verification error, not connection error
		expect(scan.errors.length).toBeGreaterThan(0);
		expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_VERIFICATION);
		// Should NOT retry - only 2 calls (one per range)
		expect(rangeScanner.scan).toHaveBeenCalledTimes(2);
	});

	it('should not produce false missing file errors when connection fails', async () => {
		const rangeScanner = mock<ArchivistRangeScanner>();

		// Simulate what happens when archive goes offline:
		// stellar-archivist reports "missing files" but with exit code 2
		const missingFileError = new ScanError(
			ScanErrorType.TYPE_VERIFICATION,
			'https://example.com/ledger',
			'15627 missing files',
			15627,
			ScanErrorCategory.MISSING_FILE
		);

		rangeScanner.scan.mockResolvedValue(
			ok({
				latestLedgerHeader: { ledger: 100 },
				errors: [missingFileError],
				exitCode: 2 // Connection error, not verification error
			})
		);

		const scanner = getScanner(rangeScanner);
		const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);

		const scanPromise = scanner.perform(new Date(), scanJob);

		// Advance through retries
		await jest.advanceTimersByTimeAsync(30000);
		await jest.advanceTimersByTimeAsync(60000);
		await jest.advanceTimersByTimeAsync(120000);

		const scan = await scanPromise;

		// Should abort with connection error, NOT report the missing files
		expect(scan.errors).toHaveLength(1);
		expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_CONNECTION);
		expect(scan.errors[0]?.category).toEqual(ScanErrorCategory.CONNECTION);
		// Should NOT have the false missing file error
		expect(
			scan.errors.some((e) => e.category === ScanErrorCategory.MISSING_FILE)
		).toBe(false);
	});
});

function getScanner(rangeScanner: ArchivistRangeScanner) {
	return new Scanner(
		rangeScanner,
		mock<RangeScanner>(), // TypeScript scanner (not used when useStellarArchivist=true)
		new ScanSettingsFactory(
			mock<CategoryScanner>(),
			mock<ArchivePerformanceTester>()
		),
		mock<Logger>(),
		mock<ExceptionLogger>(),
		true, // useStellarArchivist - use the provided rangeScanner directly
		100
	);
}
