import { spawn } from 'child_process';
import { injectable, inject } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Logger } from 'logger';
import { ScanError, ScanErrorType, ScanErrorCategory } from '../scan/ScanError';
import { Url } from 'http-helper';

export interface VerificationResult {
	latestVerifiedLedger: number;
	errors: ScanError[];
	success: boolean;
}

interface ErrorAggregation {
	category: ScanErrorCategory;
	count: number;
	firstLedger: number | null;
	lastLedger: number | null;
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
			const startTime = Date.now();

			// Periodic heartbeat to show process is still running
			const heartbeatInterval = setInterval(() => {
				const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
				this.logger.info('stellar-archivist still running', {
					url: archiveUrl.value,
					elapsedMinutes,
					fromLedger,
					toLedger,
					ledgerRange: toLedger - fromLedger
				});
			}, 5 * 60 * 1000); // Log every 5 minutes

			process.stdout.on('data', (data: Buffer) => {
				const chunk = data.toString();
				stdout += chunk;
				// Log progress lines in real-time
				for (const line of chunk.split('\n')) {
					if (line.trim() && !line.includes('level=debug')) {
						this.logger.debug('stellar-archivist', { output: line.trim() });
					}
				}
			});

			process.stderr.on('data', (data: Buffer) => {
				const chunk = data.toString();
				stderr += chunk;
				// Log error/warning lines in real-time
				for (const line of chunk.split('\n')) {
					if (line.trim()) {
						if (line.includes('level=error')) {
							this.logger.warn('stellar-archivist error', { output: line.trim() });
						} else if (line.includes('level=warn')) {
							this.logger.info('stellar-archivist warning', { output: line.trim() });
						}
					}
				}
			});

			process.on('error', (error) => {
				clearInterval(heartbeatInterval);
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
				clearInterval(heartbeatInterval);
				const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
				this.logger.info('stellar-archivist completed', {
					url: archiveUrl.value,
					exitCode: code,
					elapsedMinutes,
					fromLedger,
					toLedger
				});
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
		let latestVerifiedLedger = fromLedger;

		// Aggregate errors by category
		const aggregations = new Map<ScanErrorCategory, ErrorAggregation>();

		for (const line of lines) {
			// Parse verified ledger count to estimate latest verified ledger
			const verifiedMatch = line.match(/Verified (\d+) ledger headers/);
			if (verifiedMatch) {
				const verifiedCount = parseInt(verifiedMatch[1], 10);
				latestVerifiedLedger = Math.min(fromLedger + verifiedCount, toLedger);
			}

			// Parse summary error lines (e.g., "Error: 1000121 transaction sets (of 1000121 checked) have unexpected hashes")
			const summaryMatch = line.match(
				/level=error msg="Error: (\d+) (transaction sets|transaction result sets|ledger headers|buckets) \(of \d+ checked\) have unexpected hashes"/
			);
			if (summaryMatch) {
				const count = parseInt(summaryMatch[1], 10);
				const errorType = summaryMatch[2];
				const category = this.mapSummaryTypeToCategory(errorType);

				// Use summary count as the authoritative count
				const existing = aggregations.get(category);
				if (existing) {
					existing.count = count; // Override with summary count
				} else {
					aggregations.set(category, {
						category,
						count,
						firstLedger: null,
						lastLedger: null
					});
				}
				continue;
			}

			// Parse individual error messages for ledger tracking
			const errorMatch = line.match(/level=error msg="([^"]+)"/);
			if (errorMatch) {
				const errorMsg = errorMatch[1];
				const parsed = this.categorizeError(errorMsg);
				if (parsed) {
					const existing = aggregations.get(parsed.category);
					if (existing) {
						existing.count++;
						if (parsed.ledger !== null) {
							if (existing.firstLedger === null || parsed.ledger < existing.firstLedger) {
								existing.firstLedger = parsed.ledger;
							}
							if (existing.lastLedger === null || parsed.ledger > existing.lastLedger) {
								existing.lastLedger = parsed.ledger;
							}
						}
						// Update latest verified ledger
						if (parsed.ledger && parsed.ledger < latestVerifiedLedger) {
							latestVerifiedLedger = parsed.ledger - 1;
						}
					} else {
						aggregations.set(parsed.category, {
							category: parsed.category,
							count: 1,
							firstLedger: parsed.ledger,
							lastLedger: parsed.ledger
						});
						if (parsed.ledger && parsed.ledger < latestVerifiedLedger) {
							latestVerifiedLedger = parsed.ledger - 1;
						}
					}
				}
			}

			// Parse missing file errors
			const missingMatch = line.match(/Missing (\w+) files \((\d+)\)/);
			if (missingMatch) {
				const count = parseInt(missingMatch[2], 10);
				const existing = aggregations.get(ScanErrorCategory.MISSING_FILE);
				if (existing) {
					existing.count += count;
				} else {
					aggregations.set(ScanErrorCategory.MISSING_FILE, {
						category: ScanErrorCategory.MISSING_FILE,
						count,
						firstLedger: null,
						lastLedger: null
					});
				}
			}
		}

		// Convert aggregations to ScanErrors
		const errors = this.aggregationsToErrors(aggregations, archiveUrl.value);

		return {
			latestVerifiedLedger: Math.max(latestVerifiedLedger, fromLedger),
			errors,
			success: exitCode === 0 && errors.length === 0
		};
	}

	private mapSummaryTypeToCategory(summaryType: string): ScanErrorCategory {
		switch (summaryType) {
			case 'transaction sets':
				return ScanErrorCategory.TRANSACTION_SET_HASH;
			case 'transaction result sets':
				return ScanErrorCategory.TRANSACTION_RESULT_HASH;
			case 'ledger headers':
				return ScanErrorCategory.LEDGER_HEADER_HASH;
			case 'buckets':
				return ScanErrorCategory.BUCKET_HASH;
			default:
				return ScanErrorCategory.OTHER;
		}
	}

	private categorizeError(errorMsg: string): { category: ScanErrorCategory; ledger: number | null } | null {
		// Parse: "Error: mismatched hash on ledger header 0x03595e53: ..."
		const ledgerHeaderMatch = errorMsg.match(/mismatched hash on ledger header (0x[0-9a-fA-F]+)/);
		if (ledgerHeaderMatch) {
			return {
				category: ScanErrorCategory.LEDGER_HEADER_HASH,
				ledger: parseInt(ledgerHeaderMatch[1], 16)
			};
		}

		// Parse: "Error: mismatched hash on transaction set 0x038784ef: ..."
		const txSetMatch = errorMsg.match(/mismatched hash on transaction set (0x[0-9a-fA-F]+)/);
		if (txSetMatch) {
			return {
				category: ScanErrorCategory.TRANSACTION_SET_HASH,
				ledger: parseInt(txSetMatch[1], 16)
			};
		}

		// Parse: "Error: mismatched hash on transaction result set 0x038784ef: ..."
		const txResultMatch = errorMsg.match(/mismatched hash on transaction result set (0x[0-9a-fA-F]+)/);
		if (txResultMatch) {
			return {
				category: ScanErrorCategory.TRANSACTION_RESULT_HASH,
				ledger: parseInt(txResultMatch[1], 16)
			};
		}

		// Parse: "Error: bucket hash mismatch: ..."
		if (errorMsg.includes('bucket hash mismatch')) {
			return {
				category: ScanErrorCategory.BUCKET_HASH,
				ledger: null
			};
		}

		// Skip summary lines (already handled separately)
		if (errorMsg.includes('have unexpected hashes')) {
			return null;
		}

		// Generic error
		if (errorMsg.startsWith('Error:')) {
			return {
				category: ScanErrorCategory.OTHER,
				ledger: null
			};
		}

		return null;
	}

	private aggregationsToErrors(
		aggregations: Map<ScanErrorCategory, ErrorAggregation>,
		baseUrl: string
	): ScanError[] {
		const errors: ScanError[] = [];

		for (const [category, agg] of aggregations) {
			if (agg.count === 0) continue;

			const message = this.buildAggregatedMessage(agg);
			errors.push(
				new ScanError(
					ScanErrorType.TYPE_VERIFICATION,
					baseUrl,
					message,
					agg.count,
					category
				)
			);
		}

		return errors;
	}

	private buildAggregatedMessage(agg: ErrorAggregation): string {
		const categoryNames: Record<ScanErrorCategory, string> = {
			[ScanErrorCategory.TRANSACTION_SET_HASH]: 'transaction set hash mismatch',
			[ScanErrorCategory.TRANSACTION_RESULT_HASH]: 'transaction result hash mismatch',
			[ScanErrorCategory.LEDGER_HEADER_HASH]: 'ledger header hash mismatch',
			[ScanErrorCategory.BUCKET_HASH]: 'bucket hash mismatch',
			[ScanErrorCategory.MISSING_FILE]: 'missing file',
			[ScanErrorCategory.CONNECTION]: 'connection error',
			[ScanErrorCategory.OTHER]: 'verification error'
		};

		const categoryName = categoryNames[agg.category];
		const plural = agg.count === 1 ? '' : 's';

		if (agg.firstLedger !== null && agg.lastLedger !== null && agg.firstLedger !== agg.lastLedger) {
			return `${agg.count} ${categoryName}${plural} (ledgers ${agg.firstLedger} - ${agg.lastLedger})`;
		} else if (agg.firstLedger !== null) {
			return `${agg.count} ${categoryName}${plural} (at ledger ${agg.firstLedger})`;
		} else {
			return `${agg.count} ${categoryName}${plural}`;
		}
	}
}
