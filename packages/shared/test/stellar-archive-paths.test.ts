import {
	CHECKPOINT_FREQUENCY,
	getCheckpointForLedger,
	ledgerToHex,
	getCheckpointFilePath,
	categoryToFileType,
	getRepairAction
} from '../src/stellar-archive-paths';

describe('stellar-archive-paths', () => {
	describe('CHECKPOINT_FREQUENCY', () => {
		it('should be 64', () => {
			expect(CHECKPOINT_FREQUENCY).toBe(64);
		});
	});

	describe('getCheckpointForLedger', () => {
		it('should return 63 for ledger 0', () => {
			expect(getCheckpointForLedger(0)).toBe(63);
		});

		it('should return 63 for ledger 63', () => {
			expect(getCheckpointForLedger(63)).toBe(63);
		});

		it('should return 127 for ledger 64', () => {
			expect(getCheckpointForLedger(64)).toBe(127);
		});

		it('should return 127 for ledger 127', () => {
			expect(getCheckpointForLedger(127)).toBe(127);
		});

		it('should return 191 for ledger 128', () => {
			expect(getCheckpointForLedger(128)).toBe(191);
		});

		it('should return correct checkpoint for large ledger numbers', () => {
			// 55999998 / 64 = 874999.96..., so checkpoint is (874999 + 1) * 64 - 1 = 55999999
			expect(getCheckpointForLedger(55999998)).toBe(55999999);
		});

		it('should return same checkpoint for ledgers within same checkpoint range', () => {
			const checkpoint = getCheckpointForLedger(100);
			expect(getCheckpointForLedger(100)).toBe(checkpoint);
			expect(getCheckpointForLedger(64)).toBe(checkpoint);
			expect(getCheckpointForLedger(127)).toBe(checkpoint);
		});

		it('should handle string input gracefully (coerce to number)', () => {
			// This can happen when data comes from JSON/API responses
			// Without Number() coercion, "60326271" + 64 would concatenate to "6032627164"
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(getCheckpointForLedger('60326271' as any)).toBe(60326271);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(getCheckpointForLedger('127' as any)).toBe(127);
		});
	});

	describe('ledgerToHex', () => {
		it('should return 8-character zero-padded hex string', () => {
			expect(ledgerToHex(0)).toBe('00000000');
		});

		it('should convert small numbers correctly', () => {
			expect(ledgerToHex(63)).toBe('0000003f');
			expect(ledgerToHex(127)).toBe('0000007f');
			expect(ledgerToHex(255)).toBe('000000ff');
		});

		it('should convert large numbers correctly', () => {
			expect(ledgerToHex(55999999)).toBe('03567dff');
			expect(ledgerToHex(59499998)).toBe('038be5de');
		});
	});

	describe('getCheckpointFilePath', () => {
		it('should generate correct path for ledger files', () => {
			const path = getCheckpointFilePath(63, 'ledger');
			expect(path).toBe('ledger/00/00/00/ledger-0000003f.xdr.gz');
		});

		it('should generate correct path for transactions files', () => {
			const path = getCheckpointFilePath(55999999, 'transactions');
			expect(path).toBe('transactions/03/56/7d/transactions-03567dff.xdr.gz');
		});

		it('should generate correct path for results files', () => {
			const path = getCheckpointFilePath(127, 'results');
			expect(path).toBe('results/00/00/00/results-0000007f.xdr.gz');
		});
	});

	describe('categoryToFileType', () => {
		it('should return transactions for TRANSACTION_SET_HASH', () => {
			expect(categoryToFileType('TRANSACTION_SET_HASH')).toBe('transactions');
		});

		it('should return results for TRANSACTION_RESULT_HASH', () => {
			expect(categoryToFileType('TRANSACTION_RESULT_HASH')).toBe('results');
		});

		it('should return ledger for LEDGER_HEADER_HASH', () => {
			expect(categoryToFileType('LEDGER_HEADER_HASH')).toBe('ledger');
		});

		it('should return null for BUCKET_HASH', () => {
			expect(categoryToFileType('BUCKET_HASH')).toBeNull();
		});

		it('should return null for MISSING_FILE', () => {
			expect(categoryToFileType('MISSING_FILE')).toBeNull();
		});

		it('should return null for CONNECTION', () => {
			expect(categoryToFileType('CONNECTION')).toBeNull();
		});

		it('should return null for OTHER', () => {
			expect(categoryToFileType('OTHER')).toBeNull();
		});

		it('should return null for unknown category', () => {
			expect(categoryToFileType('UNKNOWN')).toBeNull();
		});
	});

	describe('getRepairAction', () => {
		it('should return repair action for TRANSACTION_SET_HASH', () => {
			const action = getRepairAction(55999998, 'TRANSACTION_SET_HASH');
			expect(action).toBe(
				'Start repair at checkpoint 55999999 (transactions/03/56/7d/transactions-03567dff.xdr.gz)'
			);
		});

		it('should return repair action for TRANSACTION_RESULT_HASH', () => {
			const action = getRepairAction(100, 'TRANSACTION_RESULT_HASH');
			expect(action).toBe(
				'Start repair at checkpoint 127 (results/00/00/00/results-0000007f.xdr.gz)'
			);
		});

		it('should return repair action for LEDGER_HEADER_HASH', () => {
			const action = getRepairAction(64, 'LEDGER_HEADER_HASH');
			expect(action).toBe(
				'Start repair at checkpoint 127 (ledger/00/00/00/ledger-0000007f.xdr.gz)'
			);
		});

		it('should return null when firstLedger is null', () => {
			expect(getRepairAction(null, 'TRANSACTION_SET_HASH')).toBeNull();
		});

		it('should return null for BUCKET_HASH category', () => {
			expect(getRepairAction(100, 'BUCKET_HASH')).toBeNull();
		});

		it('should return null for OTHER category', () => {
			expect(getRepairAction(100, 'OTHER')).toBeNull();
		});

		it('should return null for unknown category', () => {
			expect(getRepairAction(100, 'UNKNOWN')).toBeNull();
		});
	});
});
