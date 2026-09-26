import { err, ok, Result } from 'neverthrow';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../scan/ScanError';

/**
 * The JSON status report written by `stellar-archivist --report <path>`.
 *
 * Shape (report.rs, REPORT_VERSION 1):
 *   {
 *     "version": 1,
 *     "well_known": null | <checkpoint>,
 *     "files": { "<checkpoint>": ["history"|"ledger"|"transactions"|"results"|"scp"] },
 *     "buckets": ["<64 hex chars>"],
 *     "checkpoints": [<checkpoint>],
 *     "summary": { "succeeded": n, "skipped": n, "failed": n, "retries": n }
 *   }
 *
 * Only failures are listed, so a healthy archive reports empty collections.
 * Reading this is what replaced scraping log lines: the previous parser matched
 * the Go implementation's logrus output, which the Rust build never emits, so
 * every scan came back with an empty error list.
 */
export interface StellarArchivistReportSummary {
	succeeded: number;
	skipped: number;
	failed: number;
	retries: number;
}

export interface StellarArchivistReport {
	version: number;
	well_known: number | null;
	files: Record<string, string[]>;
	buckets: string[];
	checkpoints: number[];
	summary: StellarArchivistReportSummary;
}

//The report version this mapping was written against. A higher version still
//parses - fields are additive - but is worth surfacing, because a changed CLI
//contract is exactly how the previous integration broke silently.
export const supportedReportVersion = 1;

//Archive file categories, as named by FLAG_NAMES in report.rs.
const fileCategoryToScanErrorCategory: Record<string, ScanErrorCategory> = {
	history: ScanErrorCategory.OTHER,
	ledger: ScanErrorCategory.LEDGER_HEADER_HASH,
	transactions: ScanErrorCategory.TRANSACTION_SET_HASH,
	results: ScanErrorCategory.TRANSACTION_RESULT_HASH,
	scp: ScanErrorCategory.OTHER
};

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((entry) => typeof entry === 'string')
	);
}

function isNumberArray(value: unknown): value is number[] {
	return (
		Array.isArray(value) && value.every((entry) => typeof entry === 'number')
	);
}

export function parseStellarArchivistReport(
	raw: string
): Result<StellarArchivistReport, Error> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		return err(
			new Error(
				'Could not parse stellar-archivist report as JSON: ' +
					(error instanceof Error ? error.message : String(error))
			)
		);
	}

	if (typeof parsed !== 'object' || parsed === null)
		return err(new Error('stellar-archivist report is not an object'));

	const report = parsed as Record<string, unknown>;

	if (typeof report.version !== 'number')
		return err(new Error('stellar-archivist report has no version'));

	const files: Record<string, string[]> = {};
	if (typeof report.files === 'object' && report.files !== null) {
		for (const [checkpoint, categories] of Object.entries(
			report.files as Record<string, unknown>
		)) {
			if (isStringArray(categories)) files[checkpoint] = categories;
		}
	}

	const summary = (
		typeof report.summary === 'object' && report.summary !== null
			? report.summary
			: {}
	) as Record<string, unknown>;

	return ok({
		version: report.version,
		well_known:
			typeof report.well_known === 'number' ? report.well_known : null,
		files: files,
		buckets: isStringArray(report.buckets) ? report.buckets : [],
		checkpoints: isNumberArray(report.checkpoints) ? report.checkpoints : [],
		summary: {
			succeeded: typeof summary.succeeded === 'number' ? summary.succeeded : 0,
			skipped: typeof summary.skipped === 'number' ? summary.skipped : 0,
			failed: typeof summary.failed === 'number' ? summary.failed : 0,
			retries: typeof summary.retries === 'number' ? summary.retries : 0
		}
	});
}

/**
 * Translate a report into ScanErrors, aggregated per category the way the rest
 * of the scanner expects. Checkpoints are ledger sequences, so they double as
 * the first/last ledger bounds for a category.
 */
export function reportToScanErrors(
	report: StellarArchivistReport,
	url: string
): ScanError[] {
	const counts = new Map<
		ScanErrorCategory,
		{ count: number; firstLedger: number | null; lastLedger: number | null }
	>();

	const record = (category: ScanErrorCategory, checkpoint: number | null) => {
		const existing = counts.get(category) ?? {
			count: 0,
			firstLedger: null,
			lastLedger: null
		};
		existing.count += 1;
		if (checkpoint !== null) {
			if (existing.firstLedger === null || checkpoint < existing.firstLedger)
				existing.firstLedger = checkpoint;
			if (existing.lastLedger === null || checkpoint > existing.lastLedger)
				existing.lastLedger = checkpoint;
		}
		counts.set(category, existing);
	};

	for (const [checkpointKey, categories] of Object.entries(report.files)) {
		const checkpoint = Number(checkpointKey);
		for (const category of categories) {
			record(
				fileCategoryToScanErrorCategory[category] ?? ScanErrorCategory.OTHER,
				Number.isFinite(checkpoint) ? checkpoint : null
			);
		}
	}

	report.buckets.forEach(() => record(ScanErrorCategory.BUCKET_HASH, null));

	//A checkpoint listed here failed a cross-file or hash-chain check, which the
	//per-file entries above do not otherwise capture.
	report.checkpoints.forEach((checkpoint) =>
		record(ScanErrorCategory.LEDGER_HEADER_HASH, checkpoint)
	);

	if (report.well_known !== null)
		record(ScanErrorCategory.MISSING_FILE, report.well_known);

	const messages: Record<ScanErrorCategory, string> = {
		[ScanErrorCategory.TRANSACTION_SET_HASH]: 'transaction set hash mismatch',
		[ScanErrorCategory.TRANSACTION_RESULT_HASH]:
			'transaction result hash mismatch',
		[ScanErrorCategory.LEDGER_HEADER_HASH]: 'ledger header hash mismatch',
		[ScanErrorCategory.BUCKET_HASH]: 'bucket hash mismatch',
		[ScanErrorCategory.MISSING_FILE]: 'missing file',
		[ScanErrorCategory.SCANNER_ERROR]:
			'entry the scanner could not process (not an archive defect)',
		[ScanErrorCategory.CONNECTION]: 'connection error',
		[ScanErrorCategory.OTHER]: 'archive verification error'
	};

	return Array.from(counts.entries()).map(
		([category, aggregation]) =>
			new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				url,
				`${aggregation.count} ${messages[category]}(s) reported by stellar-archivist`,
				aggregation.count,
				category,
				aggregation.firstLedger,
				aggregation.lastLedger
			)
	);
}
