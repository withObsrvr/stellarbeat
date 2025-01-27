import { CustomError } from 'custom-error';
import { HttpService, Url } from 'http-helper';
import { injectable } from 'inversify';
import { err, ok, Result } from 'neverthrow';
import { Scan } from 'src/domain/scan/Scan';
import {
	PendingScanJob,
	ScanCoordinatorService
} from 'src/domain/scan/ScanCoordinatorService';

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

	async saveScanResult(scan: Scan): Promise<Result<void, Error>> {
		console.log(this.coordinatorAPIBaseUrl);
		const urlResult = Url.create(`${this.coordinatorAPIBaseUrl}/history-scan`);
		if (urlResult.isErr()) {
			return err(new CoordinatorServiceError('Invalid URL', urlResult.error));
		}

		const response = await this.httpService.post(
			urlResult.value,
			{ ...scan },
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

	async getPendingScanJobs(): Promise<Result<PendingScanJob[], Error>> {
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
			}
		});

		if (response.isErr()) {
			return err(
				new CoordinatorServiceError(
					'Failed to get pending jobs',
					response.error
				)
			);
		}

		if (!Array.isArray(response.value.data)) {
			return err(new CoordinatorServiceError('Invalid response format'));
		}

		return ok(response.value.data as PendingScanJob[]);
	}
}
