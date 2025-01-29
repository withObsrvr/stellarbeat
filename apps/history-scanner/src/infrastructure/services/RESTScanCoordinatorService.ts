import 'reflect-metadata';
import { CustomError } from 'custom-error';
import { HttpService, Url } from 'http-helper';
import { injectable } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Scan } from 'src/domain/scan/Scan';
import { ScanDTO, ScanJobDTO } from 'history-scanner-dto';
import { ScanCoordinatorService } from 'src/domain/scan/ScanCoordinatorService';

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
		const urlResult = Url.create(`${this.coordinatorAPIBaseUrl}/history-scan`);
		if (urlResult.isErr()) {
			return err(new CoordinatorServiceError('Invalid URL', urlResult.error));
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
						type: scan.error.type,
						url: scan.error.url
					}
				: null
		};
	}

	async getScanJobs(): Promise<Result<ScanJobDTO[], Error>> {
		const urlResult = Url.create(
			`${this.coordinatorAPIBaseUrl}/history-scan/jobs`
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

		if (!response.value.data || !Array.isArray(response.value.data)) {
			return err(new CoordinatorServiceError('Invalid response format'));
		}

		const scanJobDTOsResult = this.convertResponseToScanJobDTOs(
			response.value.data
		);
		if (scanJobDTOsResult.isErr()) {
			return err(scanJobDTOsResult.error);
		}

		return ok(scanJobDTOsResult.value);
	}

	private convertResponseToScanJobDTOs(
		response: Record<string, unknown>[]
	): Result<ScanJobDTO[], Error> {
		const scanJobsDTOS: ScanJobDTO[] = [];
		for (const scanJob of response) {
			const scanJobDTO = ScanJobDTO.fromJSON(scanJob);
			if (scanJobDTO.isErr()) {
				return err(new CoordinatorServiceError('Invalid response format'));
			}

			scanJobsDTOS.push(scanJobDTO.value);
		}

		return ok(scanJobsDTOS);
	}
}
