export interface ScanErrorDTO {
	type: string;
	url: string;
	message: string;
	count: number;
	category: string;
	firstLedger: number | null;
	lastLedger: number | null;
}
