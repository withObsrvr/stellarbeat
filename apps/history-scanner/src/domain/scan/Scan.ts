import { Url } from 'http-helper';
import { ScanError } from './ScanError';

/**
 * Used to represent a chain of scans for a history url.
 * By grouping the initDate and the url, you get all the scans in a chain. A new initDate starts a new chain for the url.
 * Start and end dates are the times the scan was started and ended for this part of the chain.
 */
export class Scan {
	//date where scan for the url was started
	public readonly scanChainInitDate: Date;
	public readonly startDate: Date;
	public readonly endDate: Date;
	public baseUrl: Url;
	public readonly fromLedger: number = 0;
	public readonly toLedger: number | null = null;
	public readonly latestScannedLedger: number = 0;
	public readonly latestScannedLedgerHeaderHash: string | null = null;
	public readonly concurrency: number = 0;
	public readonly isSlowArchive: boolean | null = null;
	public readonly error: ScanError | null = null;
	public readonly scanJobRemoteId: string | null = null;

	constructor(
		scanChainInitDate: Date,
		startDate: Date,
		endDate: Date,
		url: Url,
		fromLedger: number,
		toLedger: number | null,
		latestScannedLedger = 0,
		latestScannedLedgerHeaderHash: string | null = null,
		concurrency = 0,
		archiveIsSlow: boolean | null = null,
		error: ScanError | null = null,
		scanJobRemoteId: string | null = null
	) {
		this.baseUrl = url;
		this.scanChainInitDate = scanChainInitDate;
		this.concurrency = concurrency;
		this.startDate = startDate;
		this.endDate = endDate;
		this.isSlowArchive = archiveIsSlow;
		this.fromLedger = fromLedger;
		this.toLedger = toLedger;
		this.error = error;
		this.latestScannedLedger = latestScannedLedger;
		this.latestScannedLedgerHeaderHash = latestScannedLedgerHeaderHash;
		this.scanJobRemoteId = scanJobRemoteId;
	}

	private get url(): string {
		return this.baseUrl.value;
	}

	private set url(value: string) {
		const baseUrlResult = Url.create(value);
		if (baseUrlResult.isErr()) throw baseUrlResult.error;

		this.baseUrl = baseUrlResult.value;
	}

	hasError(): boolean {
		return this.error !== null;
	}

	public isStartOfScanChain() {
		return this.scanChainInitDate.getTime() === this.startDate.getTime();
	}

	/*
	Last ledger hash is not yet checked with trusted source,
	so we return the previous one that is surely verified through the previous header hash value
	because we verify ledgers in ascending order
	 */
	get latestVerifiedLedger() {
		if (this.latestScannedLedger === 0) return 0;

		return this.latestScannedLedger - 1;
	}
}
