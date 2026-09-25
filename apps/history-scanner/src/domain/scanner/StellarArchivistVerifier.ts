import { spawn } from 'child_process';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { injectable, inject } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Logger } from 'logger';
import { ScanError, ScanErrorType } from '../scan/ScanError';
import { Url } from 'http-helper';
import {
	parseStellarArchivistReport,
	reportToScanErrors,
	supportedReportVersion
} from './StellarArchivistReport';

export interface VerificationResult {
	latestVerifiedLedger: number;
	errors: ScanError[];
	success: boolean;
	exitCode: number | null;
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

		let reportDir: string;
		try {
			reportDir = await mkdtemp(join(tmpdir(), 'stellar-archivist-'));
		} catch (error) {
			return err(
				new ScanError(
					ScanErrorType.TYPE_CONNECTION,
					archiveUrl.value,
					'Could not create a directory for the stellar-archivist report: ' +
						(error instanceof Error ? error.message : String(error))
				)
			);
		}

		const reportPath = join(reportDir, 'report.json');

		try {
			let exitCode: number | null;
			try {
				exitCode = await this.runArchivist(
					archiveUrl,
					fromLedger,
					toLedger,
					reportPath
				);
			} catch (error) {
				//a missing or unrunnable binary is an operational fault, not an
				//archive defect, so it must not surface as a verification error
				this.logger.error('Failed to spawn stellar-archivist', {
					binaryPath: this.binaryPath,
					error: error instanceof Error ? error.message : String(error)
				});
				return err(
					new ScanError(
						ScanErrorType.TYPE_CONNECTION,
						archiveUrl.value,
						'Failed to spawn stellar-archivist: ' +
							(error instanceof Error ? error.message : String(error))
					)
				);
			}

			return await this.buildResult(
				archiveUrl,
				fromLedger,
				toLedger,
				reportPath,
				exitCode
			);
		} finally {
			await rm(reportDir, { recursive: true, force: true }).catch(() => {
				//a leftover temp directory is not worth failing a scan over
			});
		}
	}

	/**
	 * `--verify` and `--report` are global flags, while `--low` and `--high`
	 * belong to the `scan` subcommand. Passing the range before `scan` makes
	 * clap reject the invocation outright ("unexpected argument '--low'"), which
	 * is how every run of this integration used to fail.
	 */
	private buildArgs(
		archiveUrl: Url,
		fromLedger: number,
		toLedger: number,
		reportPath: string
	): string[] {
		return [
			'--verify',
			'--report',
			reportPath,
			'scan',
			'--low',
			fromLedger.toString(),
			'--high',
			toLedger.toString(),
			archiveUrl.value
		];
	}

	private runArchivist(
		archiveUrl: Url,
		fromLedger: number,
		toLedger: number,
		reportPath: string
	): Promise<number | null> {
		return new Promise((resolve, reject) => {
			const args = this.buildArgs(archiveUrl, fromLedger, toLedger, reportPath);
			const child = spawn(this.binaryPath, args);
			const startTime = Date.now();
			let stderrTail = '';

			const heartbeatInterval = setInterval(
				() => {
					this.logger.info('stellar-archivist still running', {
						url: archiveUrl.value,
						elapsedMinutes: Math.floor((Date.now() - startTime) / 60000),
						fromLedger,
						toLedger,
						ledgerRange: toLedger - fromLedger
					});
				},
				5 * 60 * 1000
			);

			//The report carries the verification outcome; logs are kept only to
			//explain a failed invocation.
			child.stderr.on('data', (data: Buffer) => {
				stderrTail = (stderrTail + data.toString()).slice(-4000);
			});

			child.on('error', (error) => {
				clearInterval(heartbeatInterval);
				reject(error);
			});

			child.on('close', (code) => {
				clearInterval(heartbeatInterval);
				this.logger.info('stellar-archivist completed', {
					url: archiveUrl.value,
					exitCode: code,
					elapsedMinutes: Math.floor((Date.now() - startTime) / 60000),
					fromLedger,
					toLedger
				});
				if (code !== 0 && stderrTail.trim().length > 0)
					this.logger.info('stellar-archivist output', {
						url: archiveUrl.value,
						output: stderrTail.trim()
					});
				resolve(code);
			});
		});
	}

	/**
	 * A non-zero exit means either the archive failed verification or the tool
	 * could not run at all - clap argument errors also exit 2. The report file
	 * is what separates them: it is written when a scan completes, and absent
	 * when the tool never got that far.
	 */
	private async buildResult(
		archiveUrl: Url,
		fromLedger: number,
		toLedger: number,
		reportPath: string,
		exitCode: number | null
	): Promise<Result<VerificationResult, ScanError>> {
		let rawReport: string;
		try {
			rawReport = await readFile(reportPath, 'utf8');
		} catch {
			return err(
				new ScanError(
					ScanErrorType.TYPE_CONNECTION,
					archiveUrl.value,
					`stellar-archivist wrote no report (exit code ${exitCode}); the scan did not run`
				)
			);
		}

		const reportResult = parseStellarArchivistReport(rawReport);
		if (reportResult.isErr())
			return err(
				new ScanError(
					ScanErrorType.TYPE_CONNECTION,
					archiveUrl.value,
					reportResult.error.message
				)
			);

		const report = reportResult.value;
		if (report.version !== supportedReportVersion)
			this.logger.info('Unexpected stellar-archivist report version', {
				url: archiveUrl.value,
				version: report.version,
				supported: supportedReportVersion
			});

		//A file the scanner could not read lands in the report exactly like one
		//whose hash did not match, so a broadly unavailable archive looks like a
		//corrupt one. A handful of failures among many successes is a real defect;
		//more failures than successes means the archive or the transport was
		//unhealthy, and reporting that as corruption would send operators
		//repairing archives that are fine.
		const checked = report.summary.succeeded + report.summary.failed;
		if (checked > 0 && report.summary.failed > report.summary.succeeded) {
			this.logger.warn('Archive largely unreadable, not reporting as corrupt', {
				url: archiveUrl.value,
				succeeded: report.summary.succeeded,
				failed: report.summary.failed
			});
			return err(
				new ScanError(
					ScanErrorType.TYPE_CONNECTION,
					archiveUrl.value,
					`stellar-archivist could not read ${report.summary.failed} of ${checked} files; treating as a connection problem rather than archive corruption`
				)
			);
		}

		const errors = reportToScanErrors(report, archiveUrl.value);

		//Ledgers are only verified up to the first failing checkpoint, so the
		//scan chain must not claim more than that.
		const firstFailedCheckpoint = errors
			.map((error) => error.firstLedger)
			.filter((ledger): ledger is number => ledger !== null)
			.sort((a, b) => a - b)[0];

		const latestVerifiedLedger =
			firstFailedCheckpoint !== undefined
				? Math.max(firstFailedCheckpoint - 1, fromLedger)
				: toLedger;

		//The report lives in a temp directory that is removed when this returns,
		//so anything not logged here is lost. Counts alone are not actionable:
		//record which checkpoints, buckets and file types failed.
		this.logger.info('stellar-archivist report', {
			url: archiveUrl.value,
			succeeded: report.summary.succeeded,
			failed: report.summary.failed,
			skipped: report.summary.skipped,
			retries: report.summary.retries,
			errorCategories: errors.length,
			failedCheckpoints: Object.entries(report.files).map(
				([checkpoint, categories]) => `${checkpoint}:${categories.join('+')}`
			),
			failedBuckets: report.buckets,
			chainFailureCheckpoints: report.checkpoints,
			wellKnownFailedAtCheckpoint: report.well_known
		});

		return ok({
			latestVerifiedLedger,
			errors,
			success: exitCode === 0 && errors.length === 0,
			exitCode
		});
	}
}
