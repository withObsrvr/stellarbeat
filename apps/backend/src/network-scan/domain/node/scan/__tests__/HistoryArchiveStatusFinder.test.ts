import {
	HistoryArchiveUpToDateStatus,
	HistoryService
} from '../history/HistoryService';
import { HistoryArchiveStatusFinder } from '../HistoryArchiveStatusFinder';
import { mock } from 'jest-mock-extended';
import { ok } from 'neverthrow';

describe('HistoryArchiveStatusFinder', () => {
	it('return the nodes with up-to-date history archives', async function () {
		const historyService = mock<HistoryService>();
		const historyArchiveStatusFinder = new HistoryArchiveStatusFinder(
			historyService
		);

		const map = new Map([
			['GAA', 'https://history.stellar.org/prd/core-live/core_live_001'],
			['GAB', 'https://history.stellar.org/prd/core-live/core_live_002']
		]);

		historyService.getArchiveCheck.mockResolvedValueOnce({
			status: HistoryArchiveUpToDateStatus.UpToDate,
			cacheMaxAgeSeconds: null
		});
		historyService.getArchiveCheck.mockResolvedValueOnce({
			status: HistoryArchiveUpToDateStatus.Stale,
			cacheMaxAgeSeconds: 3600
		});

		const statuses =
			await historyArchiveStatusFinder.getHistoryArchiveUpToDateStatuses(
				map,
				BigInt(1)
			);

		expect(statuses.upToDate.size).toEqual(1);
		expect(statuses.upToDate.has('GAA')).toBeTruthy();
		expect(statuses.stale.size).toEqual(1);
		expect(statuses.stale.has('GAB')).toBeTruthy();
		expect(statuses.unreachable.size).toEqual(0);
		expect(statuses.cacheMaxAgeSeconds.get('GAB')).toEqual(3600);
		expect(statuses.cacheMaxAgeSeconds.has('GAA')).toBeFalsy();
	});

	it('should separate archives it could not read from archives that are behind', async function () {
		const historyService = mock<HistoryService>();
		const historyArchiveStatusFinder = new HistoryArchiveStatusFinder(
			historyService
		);

		const map = new Map([
			['GAA', 'https://history.stellar.org/prd/core-live/core_live_001'],
			['GAB', 'https://history.stellar.org/prd/core-live/core_live_002']
		]);

		historyService.getArchiveCheck.mockResolvedValueOnce({
			status: HistoryArchiveUpToDateStatus.Unreachable,
			cacheMaxAgeSeconds: null
		});
		historyService.getArchiveCheck.mockResolvedValueOnce({
			status: HistoryArchiveUpToDateStatus.Stale,
			cacheMaxAgeSeconds: null
		});

		const statuses =
			await historyArchiveStatusFinder.getHistoryArchiveUpToDateStatuses(
				map,
				BigInt(1)
			);

		expect(statuses.upToDate.size).toEqual(0);
		expect(statuses.unreachable.has('GAA')).toBeTruthy();
		expect(statuses.stale.has('GAB')).toBeTruthy();
	});

	it('should fetch nodes with history archive verification errors', async function () {
		const historyService = mock<HistoryService>();
		const historyArchiveStatusFinder = new HistoryArchiveStatusFinder(
			historyService
		);

		const map = new Map([
			['GAA', 'https://history.stellar.org/prd/core-live/core_live_001'],
			['GAB', 'https://history.stellar.org/prd/core-live/core_live_002']
		]);

		historyService.getHistoryUrlsWithScanErrors.mockResolvedValueOnce(
			ok(new Set(['https://history.stellar.org/prd/core-live/core_live_001']))
		);

		const publicKeys =
			await historyArchiveStatusFinder.getNodesWithHistoryArchiveVerificationErrors(
				map
			);

		expect(publicKeys.size).toEqual(1);
		expect(publicKeys.has('GAA')).toBeTruthy();
	});
});
