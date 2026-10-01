import {
	parseStellarArchivistReport,
	reportToScanErrors,
	StellarArchivistReport
} from '../StellarArchivistReport';
import { ScanErrorCategory, ScanErrorType } from '../../scan/ScanError';

const url = 'https://history.example.com';

function report(
	overrides: Partial<StellarArchivistReport> = {}
): StellarArchivistReport {
	return {
		version: 1,
		well_known: null,
		files: {},
		buckets: [],
		checkpoints: [],
		summary: { succeeded: 0, skipped: 0, failed: 0, retries: 0 },
		...overrides
	};
}

describe('parseStellarArchivistReport', () => {
	it('parses a clean report', () => {
		const result = parseStellarArchivistReport(
			JSON.stringify({
				version: 1,
				well_known: null,
				files: {},
				buckets: [],
				checkpoints: [],
				summary: { succeeded: 97, skipped: 0, failed: 0, retries: 0 }
			})
		);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.summary.succeeded).toEqual(97);
		expect(result.value.buckets).toHaveLength(0);
	});

	it('rejects output that is not JSON', () => {
		expect(parseStellarArchivistReport('ERRO[0001] boom').isErr()).toBe(true);
	});

	it('rejects a document without a version', () => {
		expect(parseStellarArchivistReport('{"files":{}}').isErr()).toBe(true);
	});

	it('tolerates a missing summary', () => {
		const result = parseStellarArchivistReport('{"version":1}');

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.summary.failed).toEqual(0);
	});
});

describe('reportToScanErrors', () => {
	it('returns nothing for a clean archive', () => {
		expect(reportToScanErrors(report(), url)).toHaveLength(0);
	});

	it('maps each archive file category onto its scan error category', () => {
		const errors = reportToScanErrors(
			report({
				files: {
					'383': ['ledger', 'transactions', 'results']
				}
			}),
			url
		);

		const categories = errors.map((error) => error.category);
		expect(categories).toContain(ScanErrorCategory.LEDGER_HEADER_HASH);
		expect(categories).toContain(ScanErrorCategory.TRANSACTION_SET_HASH);
		expect(categories).toContain(ScanErrorCategory.TRANSACTION_RESULT_HASH);
		errors.forEach((error) => {
			expect(error.type).toEqual(ScanErrorType.TYPE_VERIFICATION);
			expect(error.url).toEqual(url);
		});
	});

	it('records the checkpoint as the ledger bounds', () => {
		const errors = reportToScanErrors(
			report({ files: { '383': ['ledger'], '447': ['ledger'] } }),
			url
		);

		expect(errors).toHaveLength(1);
		expect(errors[0].count).toEqual(2);
		expect(errors[0].firstLedger).toEqual(383);
		expect(errors[0].lastLedger).toEqual(447);
	});

	it('maps failing buckets to the bucket hash category', () => {
		const errors = reportToScanErrors(
			report({ buckets: ['a'.repeat(64), 'b'.repeat(64)] }),
			url
		);

		expect(errors).toHaveLength(1);
		expect(errors[0].category).toEqual(ScanErrorCategory.BUCKET_HASH);
		expect(errors[0].count).toEqual(2);
	});

	it('treats a broken well-known file as a missing file', () => {
		const errors = reportToScanErrors(report({ well_known: 383 }), url);

		expect(errors).toHaveLength(1);
		expect(errors[0].category).toEqual(ScanErrorCategory.MISSING_FILE);
	});

	it('counts checkpoint chain failures', () => {
		const errors = reportToScanErrors(report({ checkpoints: [383] }), url);

		expect(errors).toHaveLength(1);
		expect(errors[0].category).toEqual(ScanErrorCategory.LEDGER_HEADER_HASH);
		expect(errors[0].firstLedger).toEqual(383);
	});
});
