import { injectable } from 'inversify';
import {
	HistoryArchiveUpToDateStatus,
	HistoryService
} from './history/HistoryService';
import { queue } from 'async';

export interface HistoryArchiveUpToDateStatuses {
	upToDate: Set<string>;
	stale: Set<string>;
	unreachable: Set<string>;
	//publicKey -> max-age advertised for the archive, for those that send one
	cacheMaxAgeSeconds: Map<string, number>;
}

@injectable()
export class HistoryArchiveStatusFinder {
	protected historyService: HistoryService;

	constructor(historyService: HistoryService) {
		this.historyService = historyService;
	}

	async getHistoryArchiveUpToDateStatuses(
		publicKeyToHistoryArchiveMap: Map<string, string>,
		latestLedger: bigint
	): Promise<HistoryArchiveUpToDateStatuses> {
		const statuses: HistoryArchiveUpToDateStatuses = {
			upToDate: new Set<string>(),
			stale: new Set<string>(),
			unreachable: new Set<string>(),
			cacheMaxAgeSeconds: new Map<string, number>()
		};

		const q = queue(
			async (record: { publicKey: string; url: string }, callback) => {
				const check = await this.historyService.getArchiveCheck(
					record.url,
					latestLedger.toString()
				);
				if (check.status === HistoryArchiveUpToDateStatus.UpToDate)
					statuses.upToDate.add(record.publicKey);
				else if (check.status === HistoryArchiveUpToDateStatus.Stale)
					statuses.stale.add(record.publicKey);
				else statuses.unreachable.add(record.publicKey);

				if (check.cacheMaxAgeSeconds !== null)
					statuses.cacheMaxAgeSeconds.set(
						record.publicKey,
						check.cacheMaxAgeSeconds
					);
				callback();
			},
			10
		);

		publicKeyToHistoryArchiveMap.forEach((historyArchiveUrl, publicKey) =>
			q.push({
				publicKey: publicKey,
				url: historyArchiveUrl
			})
		);

		if (q.length() === 0) return statuses;

		await q.drain();

		return statuses;
	}

	async getNodesWithHistoryArchiveVerificationErrors(
		publicKeyToHistoryArchiveMap: Map<string, string>
	): Promise<Set<string>> {
		const nodesWithHistoryArchiveVerificationErrors = new Set<string>();
		const historyUrlsWithErrors =
			await this.historyService.getHistoryUrlsWithScanErrors(
				Array.from(publicKeyToHistoryArchiveMap.values())
			);

		if (historyUrlsWithErrors.isErr())
			return nodesWithHistoryArchiveVerificationErrors;

		publicKeyToHistoryArchiveMap.forEach((historyArchiveUrl, publicKey) => {
			if (historyUrlsWithErrors.value.has(historyArchiveUrl))
				nodesWithHistoryArchiveVerificationErrors.add(publicKey);
		});

		return nodesWithHistoryArchiveVerificationErrors;
	}
}
