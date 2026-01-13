import { spawn } from 'child_process';
import { injectable, inject } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Logger } from 'logger';
import { ScanError, ScanErrorType } from '../scan/ScanError';
import { Url } from 'http-helper';

export interface VerificationResult {
	latestVerifiedLedger: number;
	errors: ScanError[];
	success: boolean;
}

interface ParsedError {
	type: 'ledger_header' | 'transaction_set' | 'transaction_result_set' | 'bucket' | 'missing_file';
	ledger?: number;
	url: string;
	message: string;
}

@injectable()
export class StellarArchivistVerifier {
	constructor(
		@inject('Logger') private logger: Logger,
		@inject('StellarArchivistPath') private binaryPath: string
	) {}

	async verify(
		archiveUrl: Url,
		fromLedger: number,
		toLedger: number
	): Promise<Result<VerificationResult, ScanError>> {
		this.logger.info('Starting stellar-archivist verification', {
			url: archiveUrl.value,
			fromLedger,
			toLedger
		});

		return new Promise((resolve) => {
			const args = [
				'--verify',
				'--low',
				fromLedger.toString(),
				'--high',
				toLedger.toString(),
				'scan',
				archiveUrl.value
			];

			const process = spawn(this.binaryPath, args);
			let stdout = '';
			let stderr = '';

			process.stdout.on('data', (data: Buffer) => {
				stdout += data.toString();
			});

			process.stderr.on('data', (data: Buffer) => {
				stderr += data.toString();
			});

			process.on('error', (error) => {
				this.logger.error('Failed to spawn stellar-archivist', {
					error: error.message,
					binaryPath: this.binaryPath
				});
				resolve(
					err(
						new ScanError(
							ScanErrorType.TYPE_CONNECTION,
							archiveUrl.value,
							`Failed to spawn stellar-archivist: ${error.message}`
						)
					)
				);
			});

			process.on('close', (code) => {
				const output = stdout + stderr;
				const result = this.parseOutput(output, archiveUrl, fromLedger, toLedger, code);
				resolve(ok(result));
			});
		});
	}

	private parseOutput(
		output: string,
		archiveUrl: Url,
		fromLedger: number,
		toLedger: number,
		exitCode: number | null
	): VerificationResult {
		const lines = output.split('\n');
		const errors: ScanError[] = [];
		let latestVerifiedLedger = fromLedger;

		for (const line of lines) {
			// Parse verified ledger count to estimate latest verified ledger
			const verifiedMatch = line.match(/Verified (\d+) ledger headers/);
			if (verifiedMatch) {
				const verifiedCount = parseInt(verifiedMatch[1], 10);
				// Estimate: fromLedger + verifiedCount (approximate)
				latestVerifiedLedger = Math.min(fromLedger + verifiedCount, toLedger);
			}

			// Parse error messages
			const errorMatch = line.match(/level=error msg="([^"]+)"/);
			if (errorMatch) {
				const errorMsg = errorMatch[1];
				const parsedError = this.parseErrorMessage(errorMsg, archiveUrl.value);
				if (parsedError) {
					errors.push(
						new ScanError(
							ScanErrorType.TYPE_VERIFICATION,
							parsedError.url,
							parsedError.message
						)
					);

					// Update latest verified ledger based on error
					if (parsedError.ledger && parsedError.ledger < latestVerifiedLedger) {
						latestVerifiedLedger = parsedError.ledger - 1;
					}
				}
			}

			// Parse missing file errors
			const missingMatch = line.match(/Missing (\w+) files \((\d+)\): \[([^\]]+)\]/);
			if (missingMatch) {
				const category = missingMatch[1];
				const range = missingMatch[3];
				errors.push(
					new ScanError(
						ScanErrorType.TYPE_VERIFICATION,
						archiveUrl.value,
						`Missing ${category} files in range ${range}`
					)
				);
			}
		}

		return {
			latestVerifiedLedger: Math.max(latestVerifiedLedger, fromLedger),
			errors,
			success: exitCode === 0 && errors.length === 0
		};
	}

	private parseErrorMessage(errorMsg: string, baseUrl: string): ParsedError | null {
		// Parse: "Error: mismatched hash on ledger header 0x03595e53: expected ..., got ..."
		const ledgerHeaderMatch = errorMsg.match(
			/mismatched hash on ledger header (0x[0-9a-fA-F]+): expected ([^,]+), got ([^\s]+)/
		);
		if (ledgerHeaderMatch) {
			const ledgerHex = ledgerHeaderMatch[1];
			const ledger = parseInt(ledgerHex, 16);
			return {
				type: 'ledger_header',
				ledger,
				url: this.buildCategoryUrl(baseUrl, ledger, 'ledger'),
				message: `Wrong ledger hash at ledger ${ledger}`
			};
		}

		// Parse: "Error: mismatched hash on transaction set 0x038784ef: expected ..., got ..."
		const txSetMatch = errorMsg.match(
			/mismatched hash on transaction set (0x[0-9a-fA-F]+): expected ([^,]+), got ([^\s]+)/
		);
		if (txSetMatch) {
			const ledgerHex = txSetMatch[1];
			const ledger = parseInt(ledgerHex, 16);
			return {
				type: 'transaction_set',
				ledger,
				url: this.buildCategoryUrl(baseUrl, ledger, 'transactions'),
				message: `Wrong transaction hash at ledger ${ledger}`
			};
		}

		// Parse: "Error: mismatched hash on transaction result set 0x038784ef: expected ..., got ..."
		const txResultMatch = errorMsg.match(
			/mismatched hash on transaction result set (0x[0-9a-fA-F]+): expected ([^,]+), got ([^\s]+)/
		);
		if (txResultMatch) {
			const ledgerHex = txResultMatch[1];
			const ledger = parseInt(ledgerHex, 16);
			return {
				type: 'transaction_result_set',
				ledger,
				url: this.buildCategoryUrl(baseUrl, ledger, 'results'),
				message: `Wrong results hash at ledger ${ledger}`
			};
		}

		// Parse: "Error: bucket hash mismatch: expected ..., got ..."
		const bucketMatch = errorMsg.match(/bucket hash mismatch/);
		if (bucketMatch) {
			return {
				type: 'bucket',
				url: baseUrl,
				message: errorMsg
			};
		}

		// Generic error
		if (errorMsg.startsWith('Error:')) {
			return {
				type: 'missing_file',
				url: baseUrl,
				message: errorMsg.replace('Error: ', '')
			};
		}

		return null;
	}

	private buildCategoryUrl(baseUrl: string, ledger: number, category: string): string {
		// Calculate checkpoint: ledgers are in checkpoints of 64
		const checkpoint = Math.floor((ledger + 1) / 64) * 64 - 1;
		const checkpointHex = checkpoint.toString(16).padStart(8, '0');

		// URL format: baseUrl/category/xx/yy/zz/category-xxxxxxxx.xdr.gz
		const dir1 = checkpointHex.substring(0, 2);
		const dir2 = checkpointHex.substring(2, 4);
		const dir3 = checkpointHex.substring(4, 6);

		return `${baseUrl}/${category}/${dir1}/${dir2}/${dir3}/${category}-${checkpointHex}.xdr.gz`;
	}
}
