import 'reflect-metadata';
import { StellarArchivistVerifier } from '../StellarArchivistVerifier';
import { ScanErrorCategory, ScanErrorType } from '../../scan/ScanError';
import { mock } from 'jest-mock-extended';
import { Logger } from 'logger';
import { Url } from 'http-helper';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

// Mock child_process spawn
jest.mock('child_process', () => ({
	spawn: jest.fn()
}));

import { spawn } from 'child_process';
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('StellarArchivistVerifier', () => {
	let verifier: StellarArchivistVerifier;
	let mockLogger: Logger;
	let archiveUrl: Url;

	beforeEach(() => {
		mockLogger = mock<Logger>();
		verifier = new StellarArchivistVerifier(mockLogger, '/usr/bin/stellar-archivist');
		const urlResult = Url.create('https://history.stellar.org');
		if (urlResult.isErr()) throw urlResult.error;
		archiveUrl = urlResult.value;
		jest.clearAllMocks();
	});

	function createMockProcess(): ChildProcess & EventEmitter {
		const process = new EventEmitter() as ChildProcess & EventEmitter;
		process.stdout = new EventEmitter() as any;
		process.stderr = new EventEmitter() as any;
		return process;
	}

	function emitOutput(process: ChildProcess & EventEmitter, stdout: string, stderr: string, exitCode: number) {
		if (stdout) {
			process.stdout!.emit('data', Buffer.from(stdout));
		}
		if (stderr) {
			process.stderr!.emit('data', Buffer.from(stderr));
		}
		process.emit('close', exitCode);
	}

	describe('verify', () => {
		it('should handle successful verification with no errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			emitOutput(mockProcess, 'Verified 100 ledger headers', '', 0);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(true);
				expect(result.value.errors).toHaveLength(0);
				expect(result.value.latestVerifiedLedger).toBe(200);
				expect(result.value.exitCode).toBe(0);
			}
		});

		it('should expose exit code 2 for connection errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			// Exit code 2 indicates connection error
			emitOutput(mockProcess, '', 'dial tcp: connection refused', 2);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				expect(result.value.exitCode).toBe(2);
			}
		});

		it('should parse transaction set hash mismatch errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: mismatched hash on transaction set 0x00000064: expected abc got def"
level=error msg="Error: mismatched hash on transaction set 0x0000006e: expected 123 got 456"
level=error msg="Error: 2 transaction sets (of 100 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				const txSetErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
				);
				expect(txSetErrors).toHaveLength(1);
				expect(txSetErrors[0].count).toBe(2); // Summary count overrides individual
				expect(txSetErrors[0].type).toBe(ScanErrorType.TYPE_VERIFICATION);
			}
		});

		it('should parse transaction result hash mismatch errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: mismatched hash on transaction result set 0x00000064: expected abc got def"
level=error msg="Error: 5 transaction result sets (of 100 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				const txResultErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.TRANSACTION_RESULT_HASH
				);
				expect(txResultErrors).toHaveLength(1);
				expect(txResultErrors[0].count).toBe(5);
			}
		});

		it('should parse ledger header hash mismatch errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: mismatched hash on ledger header 0x00000064: expected abc got def"
level=error msg="Error: 3 ledger headers (of 100 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				const ledgerHeaderErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.LEDGER_HEADER_HASH
				);
				expect(ledgerHeaderErrors).toHaveLength(1);
				expect(ledgerHeaderErrors[0].count).toBe(3);
			}
		});

		it('should parse bucket hash mismatch errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: bucket hash mismatch: expected abc got def"
level=error msg="Error: 10 buckets (of 50 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				const bucketErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.BUCKET_HASH
				);
				expect(bucketErrors).toHaveLength(1);
				expect(bucketErrors[0].count).toBe(10);
			}
		});

		it('should track ledger ranges for errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 300);

			// 0x64 = 100, 0xc8 = 200
			const stderr = `level=error msg="Error: mismatched hash on transaction set 0x00000064: expected abc got def"
level=error msg="Error: mismatched hash on transaction set 0x000000c8: expected 123 got 456"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const txSetErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
				);
				expect(txSetErrors).toHaveLength(1);
				// Message should include ledger range when firstLedger != lastLedger
				expect(txSetErrors[0].message).toContain('ledgers');
				expect(txSetErrors[0].message).toContain('100');
				expect(txSetErrors[0].message).toContain('200');
				// Should have firstLedger and lastLedger fields
				expect(txSetErrors[0].firstLedger).toBe(100);
				expect(txSetErrors[0].lastLedger).toBe(200);
			}
		});

		it('should aggregate multiple errors of the same category', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			// Multiple individual error messages without summary line
			const stderr = `level=error msg="Error: mismatched hash on ledger header 0x00000064: expected abc got def"
level=error msg="Error: mismatched hash on ledger header 0x00000065: expected xyz got 123"
level=error msg="Error: mismatched hash on ledger header 0x00000066: expected foo got bar"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				const ledgerHeaderErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.LEDGER_HEADER_HASH
				);
				// Should aggregate all errors into one
				expect(ledgerHeaderErrors).toHaveLength(1);
				expect(ledgerHeaderErrors[0].count).toBe(3);
			}
		});

		it('should use summary count when available (overrides individual counts)', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			// 5 individual errors, but summary says 1000
			const stderr = `level=error msg="Error: mismatched hash on transaction set 0x00000064: expected abc got def"
level=error msg="Error: mismatched hash on transaction set 0x00000065: expected xyz got 123"
level=error msg="Error: mismatched hash on transaction set 0x00000066: expected foo got bar"
level=error msg="Error: mismatched hash on transaction set 0x00000067: expected qux got baz"
level=error msg="Error: mismatched hash on transaction set 0x00000068: expected one got two"
level=error msg="Error: 1000 transaction sets (of 1000 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const txSetErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
				);
				expect(txSetErrors).toHaveLength(1);
				expect(txSetErrors[0].count).toBe(1000); // Summary overrides the 5 individual errors
			}
		});

		it('should handle missing files errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = 'Missing ledger files (5)';

			emitOutput(mockProcess, stderr, '', 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const missingErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.MISSING_FILE
				);
				expect(missingErrors).toHaveLength(1);
				expect(missingErrors[0].count).toBe(5);
			}
		});

		it('should handle process spawn failure', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			mockProcess.emit('error', new Error('spawn failed: ENOENT'));

			const result = await verifyPromise;
			expect(result.isErr()).toBe(true);
			if (result.isErr()) {
				expect(result.error.type).toBe(ScanErrorType.TYPE_CONNECTION);
				expect(result.error.message).toContain('spawn');
			}
		});

		it('should update latestVerifiedLedger based on verified count', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 300);

			const stdout = 'Verified 150 ledger headers';
			emitOutput(mockProcess, stdout, '', 0);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.latestVerifiedLedger).toBe(250); // 100 + 150
			}
		});

		it('should handle multiple error categories in the same scan', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: mismatched hash on transaction set 0x00000064: expected abc got def"
level=error msg="Error: mismatched hash on ledger header 0x00000065: expected xyz got 123"
level=error msg="Error: bucket hash mismatch: expected foo got bar"
level=error msg="Error: 1 transaction sets (of 100 checked) have unexpected hashes"
level=error msg="Error: 1 ledger headers (of 100 checked) have unexpected hashes"
level=error msg="Error: 1 buckets (of 50 checked) have unexpected hashes"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.success).toBe(false);
				expect(result.value.errors.length).toBe(3);

				const categories = result.value.errors.map((e) => e.category);
				expect(categories).toContain(ScanErrorCategory.TRANSACTION_SET_HASH);
				expect(categories).toContain(ScanErrorCategory.LEDGER_HEADER_HASH);
				expect(categories).toContain(ScanErrorCategory.BUCKET_HASH);
			}
		});

		it('should build correct message for single ledger errors', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			// Only one error at ledger 100 (0x64)
			const stderr = `level=error msg="Error: mismatched hash on transaction set 0x00000064: expected abc got def"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const txSetErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
				);
				expect(txSetErrors).toHaveLength(1);
				// Message should show "at ledger" for single ledger
				expect(txSetErrors[0].message).toContain('at ledger 100');
				// firstLedger and lastLedger should both be 100
				expect(txSetErrors[0].firstLedger).toBe(100);
				expect(txSetErrors[0].lastLedger).toBe(100);
			}
		});

		it('should build correct message for errors without ledger info', async () => {
			const mockProcess = createMockProcess();
			mockSpawn.mockReturnValue(mockProcess);

			const verifyPromise = verifier.verify(archiveUrl, 100, 200);

			const stderr = `level=error msg="Error: bucket hash mismatch: expected abc got def"`;

			emitOutput(mockProcess, '', stderr, 1);

			const result = await verifyPromise;
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const bucketErrors = result.value.errors.filter(
					(e) => e.category === ScanErrorCategory.BUCKET_HASH
				);
				expect(bucketErrors).toHaveLength(1);
				// No ledger info, so just count and category
				expect(bucketErrors[0].message).toBe('1 bucket hash mismatch');
			}
		});

		// Tests for logrus format (ERRO[timestamp]) which is the actual output format
		describe('logrus format support', () => {
			it('should parse transaction set hash errors in logrus format', async () => {
				const mockProcess = createMockProcess();
				mockSpawn.mockReturnValue(mockProcess);

				const verifyPromise = verifier.verify(archiveUrl, 100, 300);

				// Actual stellar-archivist output format
				// 0x03a5fa74 = 61209204, 0x03a5fa75 = 61209205
				const stderr = `ERRO[3822] Error: mismatched hash on transaction set 0x03a5fa74: expected 6e73843542b73424844b2f3def85794045ce9ade334f0a4795c5e895ae2442dd, got 66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925
ERRO[3823] Error: mismatched hash on transaction set 0x03a5fa75: expected abc123, got def456
ERRO[3900] Error: 2 transaction sets (of 100 checked) have unexpected hashes`;

				emitOutput(mockProcess, '', stderr, 1);

				const result = await verifyPromise;
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.success).toBe(false);
					const txSetErrors = result.value.errors.filter(
						(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
					);
					expect(txSetErrors).toHaveLength(1);
					expect(txSetErrors[0].count).toBe(2); // Summary count
					expect(txSetErrors[0].firstLedger).toBe(61209204); // 0x03a5fa74
					expect(txSetErrors[0].lastLedger).toBe(61209205); // 0x03a5fa75
				}
			});

			it('should parse ledger header hash errors in logrus format', async () => {
				const mockProcess = createMockProcess();
				mockSpawn.mockReturnValue(mockProcess);

				const verifyPromise = verifier.verify(archiveUrl, 100, 200);

				const stderr = `ERRO[1234] Error: mismatched hash on ledger header 0x00000064: expected abc got def
ERRO[1300] Error: 1 ledger headers (of 50 checked) have unexpected hashes`;

				emitOutput(mockProcess, '', stderr, 1);

				const result = await verifyPromise;
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					const ledgerErrors = result.value.errors.filter(
						(e) => e.category === ScanErrorCategory.LEDGER_HEADER_HASH
					);
					expect(ledgerErrors).toHaveLength(1);
					expect(ledgerErrors[0].count).toBe(1);
					expect(ledgerErrors[0].firstLedger).toBe(100); // 0x64
					expect(ledgerErrors[0].lastLedger).toBe(100);
				}
			});

			it('should parse transaction result hash errors in logrus format', async () => {
				const mockProcess = createMockProcess();
				mockSpawn.mockReturnValue(mockProcess);

				const verifyPromise = verifier.verify(archiveUrl, 100, 200);

				const stderr = `ERRO[500] Error: mismatched hash on transaction result set 0x000000c8: expected abc got def
ERRO[600] Error: 1 transaction result sets (of 50 checked) have unexpected hashes`;

				emitOutput(mockProcess, '', stderr, 1);

				const result = await verifyPromise;
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					const txResultErrors = result.value.errors.filter(
						(e) => e.category === ScanErrorCategory.TRANSACTION_RESULT_HASH
					);
					expect(txResultErrors).toHaveLength(1);
					expect(txResultErrors[0].count).toBe(1);
					expect(txResultErrors[0].firstLedger).toBe(200); // 0xc8
				}
			});

			it('should parse bucket hash errors in logrus format', async () => {
				const mockProcess = createMockProcess();
				mockSpawn.mockReturnValue(mockProcess);

				const verifyPromise = verifier.verify(archiveUrl, 100, 200);

				const stderr = `ERRO[100] Error: bucket hash mismatch: expected abc got def
ERRO[200] Error: 5 buckets (of 10 checked) have unexpected hashes`;

				emitOutput(mockProcess, '', stderr, 1);

				const result = await verifyPromise;
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					const bucketErrors = result.value.errors.filter(
						(e) => e.category === ScanErrorCategory.BUCKET_HASH
					);
					expect(bucketErrors).toHaveLength(1);
					expect(bucketErrors[0].count).toBe(5);
				}
			});

			it('should handle mixed format output', async () => {
				const mockProcess = createMockProcess();
				mockSpawn.mockReturnValue(mockProcess);

				const verifyPromise = verifier.verify(archiveUrl, 100, 200);

				// Mix of both formats
				const stderr = `ERRO[100] Error: mismatched hash on transaction set 0x00000064: expected abc got def
level=error msg="Error: mismatched hash on transaction set 0x00000065: expected xyz got 123"
ERRO[200] Error: 2 transaction sets (of 50 checked) have unexpected hashes`;

				emitOutput(mockProcess, '', stderr, 1);

				const result = await verifyPromise;
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					const txSetErrors = result.value.errors.filter(
						(e) => e.category === ScanErrorCategory.TRANSACTION_SET_HASH
					);
					expect(txSetErrors).toHaveLength(1);
					expect(txSetErrors[0].count).toBe(2);
					expect(txSetErrors[0].firstLedger).toBe(100); // 0x64
					expect(txSetErrors[0].lastLedger).toBe(101); // 0x65
				}
			});
		});
	});
});
