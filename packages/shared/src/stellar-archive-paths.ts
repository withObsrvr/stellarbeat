export const CHECKPOINT_FREQUENCY = 64;

export function getCheckpointForLedger(ledger: number): number {
	const ledgerNum = Number(ledger);
	return (
		Math.floor((ledgerNum + CHECKPOINT_FREQUENCY) / CHECKPOINT_FREQUENCY) *
			CHECKPOINT_FREQUENCY -
		1
	);
}

export function ledgerToHex(ledger: number): string {
	return ledger.toString(16).padStart(8, '0');
}

export type ArchiveFileType = 'ledger' | 'transactions' | 'results';

export function getCheckpointFilePath(
	checkpoint: number,
	fileType: ArchiveFileType
): string {
	const hex = ledgerToHex(checkpoint);
	const prefix = `${hex.substring(0, 2)}/${hex.substring(2, 4)}/${hex.substring(4, 6)}`;
	return `${fileType}/${prefix}/${fileType}-${hex}.xdr.gz`;
}

export function categoryToFileType(
	category: string
): ArchiveFileType | null {
	switch (category) {
		case 'TRANSACTION_SET_HASH':
			return 'transactions';
		case 'TRANSACTION_RESULT_HASH':
			return 'results';
		case 'LEDGER_HEADER_HASH':
			return 'ledger';
		default:
			return null;
	}
}

export function getRepairAction(
	firstLedger: number | null,
	category: string
): string | null {
	if (firstLedger === null) return null;
	const fileType = categoryToFileType(category);
	if (!fileType) return null;
	const checkpoint = getCheckpointForLedger(firstLedger);
	const filePath = getCheckpointFilePath(checkpoint, fileType);
	return `Start repair at checkpoint ${checkpoint} (${filePath})`;
}
