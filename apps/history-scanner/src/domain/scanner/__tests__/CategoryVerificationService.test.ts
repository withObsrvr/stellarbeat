import 'reflect-metadata';
import { CategoryVerificationService } from '../CategoryVerificationService';
import { CategoryVerificationData } from '../CategoryScanner';
import { Category } from '../../history-archive/Category';
import { StandardCheckPointFrequency } from '../../check-point/StandardCheckPointFrequency';

const LEDGER = 64082311;

function data(
	overrides: Partial<CategoryVerificationData> = {}
): CategoryVerificationData {
	return {
		calculatedTxSetHashes: new Map(),
		calculatedTxSetResultHashes: new Map(),
		calculatedLedgerHeaderHashes: new Map(),
		expectedHashesPerLedger: new Map([
			[
				LEDGER,
				{
					txSetHash: 'expected_tx_set_hash',
					txSetResultHash: 'expected_result_hash',
					previousLedgerHeaderHash: 'expected_previous_header_hash',
					bucketListHash: 'expected_bucket_list_hash'
				}
			]
		]),
		protocolVersions: new Map([[LEDGER, 27]]),
		processingErrors: [],
		...overrides
	};
}

const verify = (d: CategoryVerificationData) =>
	new CategoryVerificationService().verify(
		d,
		new Map(),
		new StandardCheckPointFrequency()
	);

describe('processing errors are not archive defects', () => {
	it('should report a scanner error, not a hash mismatch, when an entry could not be processed', () => {
		// Regression: a hasher too old to decode the entry threw, so no tx set hash
		// was ever calculated. verifyTransactions then fell back to the empty
		// transaction set hash and reported the operator's healthy archive as
		// having a wrong transaction set hash.
		const result = verify(
			data({
				processingErrors: [
					{
						url: 'http://archive.example/transactions',
						category: Category.transactions,
						message: 'could not decode TransactionHistoryEntry',
						ledger: LEDGER
					}
				]
			})
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].isScannerError).toBe(true);
		expect(result.errors[0].ledger).toEqual(LEDGER);
		expect(result.errors[0].category).toEqual(Category.transactions);
	});

	it('should still report a genuine hash mismatch when the entry processed fine', () => {
		// The safeguard must not suppress real archive defects: here the hash was
		// calculated successfully and simply does not match.
		const result = verify(
			data({
				calculatedTxSetHashes: new Map([[LEDGER, 'a_different_hash']])
			})
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].isScannerError).toBeFalsy();
		expect(result.errors[0].category).toEqual(Category.transactions);
	});

	it('should ignore processing errors that could not be tied to a ledger', () => {
		// A null ledger cannot be matched to expected hashes, so it must not
		// suppress verification of unrelated ledgers.
		const result = verify(
			data({
				calculatedTxSetHashes: new Map([[LEDGER, 'a_different_hash']]),
				processingErrors: [
					{
						url: 'http://archive.example/transactions',
						category: Category.transactions,
						message: 'stream failed before any entry was read',
						ledger: null
					}
				]
			})
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].isScannerError).toBeFalsy();
	});

	it('should not blame the archive for a header chain broken by an unprocessed previous ledger', () => {
		// The header check compares against the *previous* ledger's calculated
		// hash. If that ledger was never processed, the resulting mismatch says
		// nothing about the archive.
		const result = verify(
			data({
				calculatedTxSetHashes: new Map([[LEDGER, 'expected_tx_set_hash']]),
				calculatedTxSetResultHashes: new Map([
					[LEDGER, 'expected_result_hash']
				]),
				processingErrors: [
					{
						url: 'http://archive.example/ledger',
						category: Category.ledger,
						message: 'could not decode LedgerHeaderHistoryEntry',
						ledger: LEDGER - 1
					}
				]
			})
		);

		expect(
			result.errors.filter((e) => e.category === Category.ledger)
		).toHaveLength(0);
	});
});
