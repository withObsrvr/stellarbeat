export class ScanJob {
	constructor(
		public readonly url: string,
		public readonly latestScannedLedger = 0,
		public readonly latestScannedLedgerHeaderHash: string | null = null,
		public readonly chainInitDate: Date | null = null
	) {}

	isNewScanChainJob(): boolean {
		return this.chainInitDate === null;
	}
}
