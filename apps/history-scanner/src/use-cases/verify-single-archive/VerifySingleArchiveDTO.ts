export interface VerifySingleArchiveDTO {
	historyUrl: string;
	fromLedger?: number;
	toLedger?: number;
	maxConcurrency?: number;
}
