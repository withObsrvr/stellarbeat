import { Url } from 'http-helper';
import { Scan } from '../scan/Scan';
import { RestartAtLeastOneScan } from '../ScanScheduler';
import { ScanJob } from '../ScanJob';

let counter = 0;
const createDummyHistoryBaseUrl = () => {
	const url = Url.create('https://history.stellar.org/' + counter++);
	if (url.isErr()) throw url.error;
	return url.value;
};

it('should start new scans for newly detected archives', function () {
	const scheduler = new RestartAtLeastOneScan();
	const archiveUrl1 = createDummyHistoryBaseUrl();
	const archiveUrl2 = createDummyHistoryBaseUrl();

	const scanJobs = scheduler.schedule(
		[archiveUrl1.value, archiveUrl2.value],
		[]
	);
	expect(scanJobs).toHaveLength(2);
	expect(scanJobs.filter((scan) => scan.isNewScanChainJob())).toHaveLength(2);
});

it('should restart at least one scan, the oldest chain', async function () {
	const scheduler = new RestartAtLeastOneScan();
	const archiveUrl = createDummyHistoryBaseUrl();
	const olderArchiveUrl = createDummyHistoryBaseUrl();

	const previousScan = new Scan(
		new Date('01-01-2001'),
		new Date('01-01-2001'), //older scan update
		new Date('01-01-2001'),
		archiveUrl,
		50,
		100,
		49,
		'hash'
	);
	const olderPreviousScan = new Scan(
		new Date('01-01-2000'), //oldest init date
		new Date('01-01-2002'),
		new Date('01-01-2002'),
		olderArchiveUrl,
		50,
		100,
		49,
		'hash'
	);

	const scanJobs = scheduler.schedule(
		[archiveUrl.value, olderArchiveUrl.value],
		[previousScan, olderPreviousScan]
	);
	expect(scanJobs).toHaveLength(2);
	const continueJob = scanJobs
		.filter((job) => job.url === archiveUrl.value)
		.pop() as ScanJob;
	expect(continueJob.chainInitDate?.getTime()).toEqual(
		previousScan.scanChainInitDate.getTime()
	);
	expect(continueJob.isNewScanChainJob()).toBeFalsy();
	expect(continueJob.latestScannedLedger).toEqual(
		previousScan.latestScannedLedger
	);
	expect(continueJob.latestScannedLedgerHeaderHash).toEqual(
		previousScan.latestScannedLedgerHeaderHash
	);

	const newChainJob = scanJobs
		.filter((scan) => scan.url === olderArchiveUrl.value)
		.pop() as ScanJob;
	expect(newChainJob.isNewScanChainJob()).toBeTruthy();
	expect(newChainJob.latestScannedLedger).toEqual(0);
	expect(newChainJob.latestScannedLedgerHeaderHash).toBeNull();
});

it('should only schedule valid history urls', () => {
	const scheduler = new RestartAtLeastOneScan();

	// Include a valid URL with trailing slash, another valid URL, and an invalid URL
	const validWithSlash = 'https://history.stellar.org/test/';
	const validNoSlash = 'https://history.stellar.org/test2';
	const invalidUrl = 'htp:://wrong';

	const jobs = scheduler.schedule(
		[validWithSlash, validNoSlash, invalidUrl],
		[]
	);

	// Only the valid URLs should be scheduled
	expect(jobs).toHaveLength(2);

	// Confirm trailing slash is removed
	const scheduledUrls = jobs.map((job) => job.url);
	expect(scheduledUrls).toContain('https://history.stellar.org/test');
	expect(scheduledUrls).toContain(validNoSlash);
	expect(scheduledUrls).not.toContain(invalidUrl);
});
