import 'reflect-metadata';
import { err, ok, Result } from 'neverthrow';
import { isNumber, isObject } from '../../../../../core/utilities/TypeGuards';
import { inject, injectable } from 'inversify';
import { Url, HttpService, HttpOptions, isHttpError } from 'http-helper';
import { CustomError } from '../../../../../core/errors/CustomError';
import { Logger } from '../../../../../core/services/Logger';
import { HistoryArchiveScanService } from './HistoryArchiveScanService';
import { NETWORK_TYPES } from '../../../../infrastructure/di/di-types';

export class FetchHistoryError extends CustomError {
	constructor(url: string, cause?: Error) {
		super('Failed fetching history at ' + url, FetchHistoryError.name, cause);
	}
}

export enum HistoryArchiveUpToDateStatus {
	UpToDate = 'up-to-date',
	Stale = 'stale',
	Unreachable = 'unreachable'
}

//allow for a margin to account for delay in archiving
const ledgerMargin = 100;

//The .well-known document is small, but archives are commonly served from
//object storage far away from the scanner. Passing no options at all fell back
//to a two second budget for the whole request, so a slow archive was recorded
//as 'not up to date' - indistinguishable from an archive that is genuinely
//behind. Both timeouts are stated explicitly to keep that budget visible.
const fetchSocketTimeoutMs = 5000;
const fetchConnectionTimeoutMs = 10000;

@injectable()
export class HistoryService {
	constructor(
		@inject('HttpService') protected httpService: HttpService,
		@inject(NETWORK_TYPES.HistoryArchiveScanService)
		protected historyArchiveScanService: HistoryArchiveScanService,
		@inject('Logger') protected logger: Logger
	) {}

	async fetchStellarHistoryLedger(
		historyUrl: string
	): Promise<Result<number, FetchHistoryError>> {
		historyUrl = historyUrl.replace(/\/$/, ''); //remove trailing slash
		const stellarHistoryUrl = historyUrl + '/.well-known/stellar-history.json';

		const urlResult = Url.create(stellarHistoryUrl);
		if (urlResult.isErr())
			return err(new FetchHistoryError(stellarHistoryUrl, urlResult.error));

		const httpOptions: HttpOptions = {
			socketTimeoutMs: fetchSocketTimeoutMs,
			connectionTimeoutMs: fetchConnectionTimeoutMs
		};

		const response = await this.httpService.get(urlResult.value, httpOptions);
		if (response.isErr())
			return err(new FetchHistoryError(stellarHistoryUrl, response.error));

		if (!isObject(response.value.data))
			return err(
				new FetchHistoryError(
					stellarHistoryUrl,
					new Error('Invalid history response, no data property')
				)
			);

		const currentLedgerResult = this.extractLedger(response.value.data);

		if (currentLedgerResult.isErr()) {
			return err(
				new FetchHistoryError(stellarHistoryUrl, currentLedgerResult.error)
			);
		}

		return ok(currentLedgerResult.value);
	}

	protected extractLedger(
		stellarHistory: Record<string, unknown>
	): Result<number, Error> {
		if (isNumber(stellarHistory.currentLedger)) {
			return ok(stellarHistory.currentLedger);
		}

		return err(
			new Error('Ledger not a number: ' + stellarHistory.currentLedger)
		);
	}

	async getUpToDateStatus(
		historyUrl: string,
		latestLedger: string
	): Promise<HistoryArchiveUpToDateStatus> {
		const stellarHistoryResult =
			await this.fetchStellarHistoryLedger(historyUrl);

		if (stellarHistoryResult.isErr()) {
			//An archive we could not read is not the same thing as an archive that
			//is behind. Collapsing the two hid connectivity problems as staleness.
			const cause = stellarHistoryResult.error.cause;
			this.logger.info('Could not read history archive state', {
				url: historyUrl,
				message: stellarHistoryResult.error.message,
				code: isHttpError(cause) ? cause.code : undefined
			});
			return HistoryArchiveUpToDateStatus.Unreachable;
		}

		//todo: latestLedger sequence is bigint, but horizon returns number type for ledger sequence
		if (stellarHistoryResult.value + ledgerMargin >= Number(latestLedger))
			return HistoryArchiveUpToDateStatus.UpToDate;

		this.logger.info('History archive is behind', {
			url: historyUrl,
			archiveLedger: stellarHistoryResult.value,
			latestLedger: latestLedger,
			ledgersBehind: Number(latestLedger) - stellarHistoryResult.value
		});

		return HistoryArchiveUpToDateStatus.Stale;
	}

	async getHistoryUrlsWithScanErrors(
		historyUrls: string[]
	): Promise<Result<Set<string>, Error>> {
		const scanResult = await this.historyArchiveScanService.findLatestScans();
		if (scanResult.isErr()) return err(scanResult.error);
		const scansWithErrors = new Set(
			scanResult.value.filter((scan) => scan.hasError).map((scan) => scan.url)
		);
		this.logger.info('History archive errors', {
			urls: Array.from(scansWithErrors)
		});

		const historyUrlsWithErrors = new Set<string>();

		historyUrls.forEach((historyUrl) => {
			const urlResult = Url.create(historyUrl); //to make sure matching happens (trailing slashes etc), could use a cleaner solution
			if (urlResult.isErr())
				this.logger.info('Invalid history url', {
					url: historyUrl
				});
			else if (scansWithErrors.has(urlResult.value.value)) {
				historyUrlsWithErrors.add(historyUrl);
			}
		});

		return ok(historyUrlsWithErrors);
	}

	async scheduleScans(historyUrls: string[]): Promise<void> {
		this.historyArchiveScanService.scheduleScans(historyUrls);
	}
}
