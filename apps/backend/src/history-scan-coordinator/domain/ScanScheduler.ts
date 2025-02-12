import { sortHistoryUrls } from './sortHistoryUrls';
import { Scan } from './scan/Scan';
import { ScanJob } from './ScanJob';
import { Url } from 'http-helper';

export interface ScanScheduler {
	schedule(archives: string[], previousScans: Scan[]): ScanJob[];
}

export class RestartAtLeastOneScan implements ScanScheduler {
	schedule(archives: string[], previousScans: Scan[]): ScanJob[] {
		const scanJobs: ScanJob[] = [];

		const validArchiveUrls = this.mapToValidUrls(archives);
		const uniqueArchives = this.removeDuplicates(validArchiveUrls);
		const previousScansMap = new Map(
			previousScans.map((scan) => {
				return [scan.baseUrl.value, scan];
			})
		);

		const archivesSortedByInitDate = sortHistoryUrls(
			uniqueArchives,
			new Map(
				previousScans
					.filter((scan) => scan.scanChainInitDate !== null)
					.map((scan) => {
						return [scan.baseUrl.value, scan.scanChainInitDate];
					})
			)
		);

		//we want to start at least one scan from the very beginning
		let hasAtLeastOneInitScan = false;
		archivesSortedByInitDate.forEach((archive) => {
			if (!hasAtLeastOneInitScan) {
				hasAtLeastOneInitScan = true;
				scanJobs.push(new ScanJob(archive));
				return;
			}

			const previousScan = previousScansMap.get(archive);
			if (!previousScan) {
				scanJobs.push(new ScanJob(archive));
			} else {
				scanJobs.push(
					new ScanJob(
						archive,
						previousScan.latestScannedLedger,
						previousScan.latestScannedLedgerHeaderHash,
						previousScan.scanChainInitDate
					)
				);
			}
		});

		return scanJobs;
	}

	private removeDuplicates(urls: string[]): string[] {
		return Array.from(new Set(urls));
	}

	private mapToValidUrls(archives: string[]): string[] {
		return archives
			.map((archive) => Url.create(archive))
			.filter((result) => result.isOk())
			.map((result) => result.value.value);
	}
}
