import 'reflect-metadata';
import { StellarArchivistVerifier } from '../StellarArchivistVerifier';
import { ScanErrorCategory, ScanErrorType } from '../../scan/ScanError';
import { mock } from 'jest-mock-extended';
import { Logger } from 'logger';
import { Url } from 'http-helper';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { writeFileSync } from 'fs';

jest.mock('child_process', () => ({
	spawn: jest.fn()
}));

import { spawn } from 'child_process';
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

//Reports captured from stellar-archivist 28.0.0 against a mirrored testnet
//range, clean and with a deleted results file plus a corrupted bucket and
//ledger file.
const cleanReport = {
	version: 1,
	well_known: null,
	files: {},
	buckets: [],
	checkpoints: [],
	summary: { succeeded: 97, skipped: 0, failed: 0, retries: 0 }
};

const failingReport = {
	version: 1,
	well_known: null,
	files: { '383': ['ledger'] },
	buckets: ['363b5b1d1056e3f3848e141d38ddd297a188bc48582e833b2dfd2f17fb7958ff'],
	checkpoints: [383],
	summary: { succeeded: 95, skipped: 0, failed: 2, retries: 0 }
};

describe('StellarArchivistVerifier', () => {
	let verifier: StellarArchivistVerifier;
	let archiveUrl: Url;
	let lastArgs: string[];

	beforeEach(() => {
		verifier = new StellarArchivistVerifier(
			mock<Logger>(),
			'/usr/bin/stellar-archivist'
		);
		const urlResult = Url.create('https://history.stellar.org');
		if (urlResult.isErr()) throw urlResult.error;
		archiveUrl = urlResult.value;
		lastArgs = [];
		jest.clearAllMocks();
	});

	/**
	 * Stand in for the binary: record the arguments, optionally write the report
	 * to the path the verifier asked for, then exit.
	 */
	function mockArchivist(report: unknown | null, exitCode: number) {
		mockSpawn.mockImplementation((_binary, args) => {
			lastArgs = args as string[];
			const child = new EventEmitter() as ChildProcess & EventEmitter;
			child.stdout = new EventEmitter() as never;
			child.stderr = new EventEmitter() as never;

			setImmediate(() => {
				if (report !== null) {
					const reportPath = lastArgs[lastArgs.indexOf('--report') + 1];
					writeFileSync(reportPath, JSON.stringify(report));
				}
				child.emit('close', exitCode);
			});

			return child;
		});
	}

	it('passes --low and --high after the scan subcommand', async () => {
		mockArchivist(cleanReport, 0);

		await verifier.verify(archiveUrl, 100, 200);

		//clap rejects the range flags when they precede the subcommand, which
		//made every previous invocation exit 2 without scanning
		const scanIndex = lastArgs.indexOf('scan');
		expect(scanIndex).toBeGreaterThan(-1);
		expect(lastArgs.indexOf('--low')).toBeGreaterThan(scanIndex);
		expect(lastArgs.indexOf('--high')).toBeGreaterThan(scanIndex);
		expect(lastArgs.indexOf('--verify')).toBeLessThan(scanIndex);
		expect(lastArgs.indexOf('--report')).toBeLessThan(scanIndex);
		expect(lastArgs[lastArgs.length - 1]).toEqual(archiveUrl.value);
	});

	it('reports a clean archive as successful', async () => {
		mockArchivist(cleanReport, 0);

		const result = await verifier.verify(archiveUrl, 100, 200);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.success).toBe(true);
		expect(result.value.errors).toHaveLength(0);
		expect(result.value.latestVerifiedLedger).toEqual(200);
	});

	it('maps reported failures onto scan error categories', async () => {
		mockArchivist(failingReport, 2);

		const result = await verifier.verify(archiveUrl, 100, 500);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.success).toBe(false);

		const categories = result.value.errors.map((error) => error.category);
		expect(categories).toContain(ScanErrorCategory.LEDGER_HEADER_HASH);
		expect(categories).toContain(ScanErrorCategory.BUCKET_HASH);
	});

	it('does not claim ledgers beyond the first failing checkpoint', async () => {
		mockArchivist(failingReport, 2);

		const result = await verifier.verify(archiveUrl, 100, 500);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.latestVerifiedLedger).toEqual(382);
	});

	it('refuses to call a largely unreadable archive corrupt', async () => {
		//transient read failures land in the report exactly like hash mismatches,
		//so a mostly unreadable archive must not be reported as corruption
		mockArchivist(
			{
				version: 1,
				well_known: null,
				files: { '383': ['transactions'], '447': ['transactions'] },
				buckets: [],
				checkpoints: [],
				summary: { succeeded: 2, skipped: 0, failed: 60, retries: 0 }
			},
			2
		);

		const result = await verifier.verify(archiveUrl, 100, 500);

		expect(result.isErr()).toBe(true);
		if (result.isOk()) return;
		expect(result.error.type).toEqual(ScanErrorType.TYPE_CONNECTION);
		expect(result.error.message).toContain('could not read');
	});

	it('still reports a few failures among many successes as defects', async () => {
		//the real obsrvr-core-1 shape: 5 failures out of 195,345 files
		mockArchivist(
			{
				version: 1,
				well_known: null,
				files: { '383': ['transactions'] },
				buckets: [],
				checkpoints: [],
				summary: { succeeded: 195340, skipped: 0, failed: 5, retries: 0 }
			},
			2
		);

		const result = await verifier.verify(archiveUrl, 100, 500);

		expect(result.isOk()).toBe(true);
		if (result.isErr()) return;
		expect(result.value.success).toBe(false);
		expect(result.value.errors.length).toBeGreaterThan(0);
	});

	it('fails loudly when the tool exits without writing a report', async () => {
		//a clap argument error exits 2 the same way a failed verification does,
		//so the missing report is what separates them
		mockArchivist(null, 2);

		const result = await verifier.verify(archiveUrl, 100, 200);

		expect(result.isErr()).toBe(true);
		if (result.isOk()) return;
		expect(result.error.message).toContain('wrote no report');
	});

	it('fails when the report is not valid JSON', async () => {
		mockSpawn.mockImplementation((_binary, args) => {
			lastArgs = args as string[];
			const child = new EventEmitter() as ChildProcess & EventEmitter;
			child.stdout = new EventEmitter() as never;
			child.stderr = new EventEmitter() as never;
			setImmediate(() => {
				writeFileSync(lastArgs[lastArgs.indexOf('--report') + 1], 'not json');
				child.emit('close', 0);
			});
			return child;
		});

		const result = await verifier.verify(archiveUrl, 100, 200);

		expect(result.isErr()).toBe(true);
	});

	it('returns a connection error when the binary cannot be spawned', async () => {
		mockSpawn.mockImplementation(() => {
			const child = new EventEmitter() as ChildProcess & EventEmitter;
			child.stdout = new EventEmitter() as never;
			child.stderr = new EventEmitter() as never;
			setImmediate(() => child.emit('error', new Error('ENOENT')));
			return child;
		});

		const result = await verifier.verify(archiveUrl, 100, 200);

		expect(result.isErr()).toBe(true);
		if (result.isOk()) return;
		expect(result.error.type).toEqual(ScanErrorType.TYPE_CONNECTION);
		expect(result.error.message).toContain('Failed to spawn');
	});
});
