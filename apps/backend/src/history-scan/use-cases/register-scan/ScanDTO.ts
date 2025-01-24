export interface ScanErrorDTO {
	type: string;
	url: string;
	message: string;
}

export interface ScanDTO {
	startDate: Date;
	endDate: Date;
	baseUrl: string;
	scanChainInitDate: Date;
	fromLedger: number;
	toLedger: number | null;
	latestVerifiedLedger: number;
	latestScannedLedger: number;
	latestScannedLedgerHeaderHash: string | null;
	concurrency: number;
	isSlowArchive: boolean | null;
	error: ScanErrorDTO | null;
}
