import 'reflect-metadata';
import { Scanner } from '../Scanner';
import { mock } from 'jest-mock-extended';
import { createDummyHistoryBaseUrl } from '../../history-archive/__fixtures__/HistoryBaseUrl';
import { err, ok } from 'neverthrow';
import { ArchivistRangeScanner } from '../ArchivistRangeScanner';
import { ScanError, ScanErrorType } from '../../scan/ScanError';
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
			errors: []
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
	const rangeScanner = mock<ArchivistRangeScanner>();
	rangeScanner.scan.mockResolvedValue(
		err(new ScanError(ScanErrorType.TYPE_VERIFICATION, 'url', 'message'))
	);
	const scanner = getScanner(rangeScanner);

	const archiveUrl = createDummyHistoryBaseUrl();
	const scanJob = ScanJob.newScanChain(archiveUrl, 0, 200, 1);
	const scan = await scanner.perform(new Date(), scanJob);

	expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_VERIFICATION);
	// After aggregation, errors use the archive URL instead of individual file URLs
	expect(scan.errors[0]?.url).toEqual(archiveUrl.value);
	expect(scan.latestScannedLedger).toEqual(0);
	expect(scan.latestScannedLedgerHeaderHash).toEqual(null);
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
			errors: [verificationError]
		})
	);

	const scanner = getScanner(rangeScanner);
	const scanJob = ScanJob.newScanChain(createDummyHistoryBaseUrl(), 0, 200, 1);
	const scan = await scanner.perform(new Date(), scanJob);

	expect(scan.errors.length).toBeGreaterThan(0);
	expect(scan.errors[0]?.type).toEqual(ScanErrorType.TYPE_VERIFICATION);
	expect(scan.latestScannedLedger).toEqual(200);
});

function getScanner(rangeScanner: ArchivistRangeScanner) {
	return new Scanner(
		rangeScanner,
		new ScanSettingsFactory(
			mock<CategoryScanner>(),
			mock<ArchivePerformanceTester>()
		),
		mock<Logger>(),
		mock<ExceptionLogger>(),
		100
	);
}
