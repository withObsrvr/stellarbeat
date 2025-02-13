import 'reflect-metadata';
import { CustomError } from 'custom-error';
import { HttpService, Url } from 'http-helper';
import { injectable } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Scan } from 'src/domain/scan/Scan';
import { ScanDTO, ScanJobDTO } from 'history-scanner-dto';
import { ScanCoordinatorService } from 'src/domain/scan/ScanCoordinatorService';
import { isObject } from 'shared';
import { ScanErrorType } from '../../domain/scan/ScanError';

export class CoordinatorServiceError extends CustomError {
	constructor(message: string, cause?: Error) {
		super(message, CoordinatorServiceError.name, cause);
	}
}

@injectable()
export class RESTScanCoordinatorService implements ScanCoordinatorService {
	constructor(
		private readonly httpService: HttpService,
		private readonly coordinatorAPIBaseUrl: string,
		private readonly coordinatorAPIUsername: string,
		private readonly coordinatorAPIPassword: string
	) {}

	async registerScan(scan: Scan): Promise<Result<void, Error>> {
		const urlResult = Url.create(
			`${this.coordinatorAPIBaseUrl}/v1/history-scan`
		);
		if (urlResult.isErr()) {
			return err(new CoordinatorServiceError('Invalid URL', urlResult.error));
		}

		if (scan.scanJobRemoteId === null) {
			return err(new CoordinatorServiceError('Scan job remote ID is null'));
		}

		const scanDTO = this.convertScanToDTO(scan);

		const response = await this.httpService.post(
			urlResult.value,
			scanDTO as unknown as Record<string, unknown>,
			{
				auth: {
					username: this.coordinatorAPIUsername,
					password: this.coordinatorAPIPassword
				}
			}
		);

		if (response.isErr()) {
			return err(
				new CoordinatorServiceError(
					'Failed to save scan result',
					response.error
				)
			);
		}

		if (response.value.status !== 201) {
			return err(new CoordinatorServiceError('Failed to save scan result'));
		}

		return ok(undefined);
	}

	private convertScanToDTO(scan: Scan): ScanDTO {
		return {
			baseUrl: scan.baseUrl.value,
			startDate: scan.startDate,
			endDate: scan.endDate,
			scanChainInitDate: scan.scanChainInitDate,
			fromLedger: scan.fromLedger,
			toLedger: scan.toLedger,
			latestVerifiedLedger: scan.latestVerifiedLedger,
			latestScannedLedger: scan.latestScannedLedger,
			latestScannedLedgerHeaderHash: scan.latestScannedLedgerHeaderHash,
			concurrency: scan.concurrency,
			isSlowArchive: scan.isSlowArchive,
			error: scan.error
				? {
						message: scan.error.message,
						type: ScanErrorType[scan.error.type],
						url: scan.error.url
					}
				: null,
			scanJobRemoteId: scan.scanJobRemoteId!
		};
	}

	async getScanJob(): Promise<Result<ScanJobDTO, Error>> {
		const urlResult = Url.create(
			`${this.coordinatorAPIBaseUrl}/v1/history-scan/job`
		);
		if (urlResult.isErr()) {
			return err(new CoordinatorServiceError('Invalid URL', urlResult.error));
		}

		const response = await this.httpService.get(urlResult.value, {
			auth: {
				username: this.coordinatorAPIUsername,
				password: this.coordinatorAPIPassword
			},
			responseType: 'json'
		});

		if (response.isErr()) {
			return err(
				new CoordinatorServiceError(
					'Failed to get pending jobs',
					response.error
				)
			);
		}

		if (response.value.status !== 200) {
			return err(new CoordinatorServiceError('Failed to get pending jobs'));
		}

		const scanJobJSON = response.value.data;

		if (!isObject(scanJobJSON)) {
			return err(
				new CoordinatorServiceError('Scan Job JSON must be an object')
			);
		}

		const scanJobDTOsResult = this.convertResponseToScanJobDTO(scanJobJSON);
		if (scanJobDTOsResult.isErr()) {
			return err(scanJobDTOsResult.error);
		}

		return ok(scanJobDTOsResult.value);
	}

	private convertResponseToScanJobDTO(
		response: Record<string, unknown>
	): Result<ScanJobDTO, Error> {
		const scanJobDTO = ScanJobDTO.fromJSON(response);
		if (scanJobDTO.isErr()) {
			return err(new CoordinatorServiceError('Invalid response format'));
		}

		return ok(scanJobDTO.value);
	}
}
