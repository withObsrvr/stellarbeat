import { sortHistoryUrls } from '../sortHistoryUrls';

let counter = 0;
const createDummyHistoryBaseUrl = () => {
	return 'https://history.stellar.org/' + counter++;
};

it('should sort not yet scanned urls in the front', function () {
	const scannedUrl = createDummyHistoryBaseUrl();
	const notYetScannedUrl = createDummyHistoryBaseUrl();

	const scanDates = new Map<string, Date>();
	scanDates.set(scannedUrl, new Date());

	const sortedUrls = sortHistoryUrls([scannedUrl, notYetScannedUrl], scanDates);
	expect(sortedUrls[0]).toEqual(notYetScannedUrl);
});

it('should sort older scans in the front', function () {
	const noScan = createDummyHistoryBaseUrl();
	const newScan = createDummyHistoryBaseUrl();
	const newestScan = createDummyHistoryBaseUrl();
	const oldScan = createDummyHistoryBaseUrl();

	const scanDates = new Map<string, Date>();
	scanDates.set(newScan, new Date('01-01-2020'));
	scanDates.set(newestScan, new Date('01-01-2021'));
	scanDates.set(oldScan, new Date('01-01-2019'));

	const sortedUrls = sortHistoryUrls(
		[newScan, newestScan, noScan, oldScan],
		scanDates
	);

	expect(sortedUrls[0]).toEqual(noScan);
	expect(sortedUrls[1]).toEqual(oldScan);
	expect(sortedUrls[2]).toEqual(newScan);
	expect(sortedUrls[3]).toEqual(newestScan);
});
