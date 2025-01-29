import { Url } from 'http-helper';
import { Scan } from './Scan';
import { ScanSettings } from './ScanSettings';
import { ScanError } from './ScanError';
import { ScanResult } from './ScanResult';
import { err, ok, Result } from 'neverthrow';
import { ScanJobDTO } from 'history-scanner-dto';

//a scheduled scan with optional settings. Has no start and end time yet.
export class ScanJob {
	private constructor(
		public readonly url: Url,
		public readonly latestScannedLedger = 0,
		public readonly latestScannedLedgerHeaderHash: string | null = null,
		public readonly chainInitDate: Date | null = null,
		public readonly fromLedger = 0,
		public readonly toLedger: number | null = null,
		public readonly concurrency = 0
	) {}

	static fromScanJobDTO(dto: ScanJobDTO): Result<ScanJob, Error> {
		const urlResult = Url.create(dto.url);
		if (urlResult.isErr()) {
			return err(urlResult.error);
		}

		return ok(
			new ScanJob(
				urlResult.value,
				dto.latestScannedLedger,
				dto.latestScannedLedgerHeaderHash,
				dto.chainInitDate,
				dto.latestScannedLedger + 1,
				null,
				0
			)
		);
	}

	isNewScanChainJob() {
		return this.chainInitDate === null;
	}

	createFailedScanCouldNotDetermineSettings(
		startDate: Date,
		endDate: Date,
		error: ScanError
	) {
		return new Scan(
			this.chainInitDate ?? startDate,
			startDate,
			endDate,
			this.url,
			this.fromLedger,
			this.toLedger,
			this.latestScannedLedger,
			this.latestScannedLedgerHeaderHash,
			this.concurrency,
			null,
			error
		);
	}

	createScanFromScanResult(
		startDate: Date,
		endDate: Date,
		settings: ScanSettings,
		scanResult: ScanResult
	) {
		return new Scan(
			this.chainInitDate ?? startDate,
			startDate,
			endDate,
			this.url,
			settings.fromLedger,
			settings.toLedger,
			scanResult.latestLedgerHeader.ledger,
			scanResult.latestLedgerHeader.hash,
			settings.concurrency,
			settings.isSlowArchive,
			scanResult.error
		);
	}
}
