import { Result, ok, err } from 'neverthrow';
import { injectable } from 'inversify';
import { Url } from 'http-helper';
import 'reflect-metadata';
import { Scan } from '../../domain/scan/Scan';
import { ScanError, ScanErrorType } from '../../domain/scan/ScanError';
import { ScanDTO, ScanErrorDTO } from '../../use-cases/register-scan/ScanDTO';

@injectable()
export class ScanMapper {
	public toDomain(dto: ScanDTO): Result<Scan, Error> {
		try {
			// Validate dates
			if (!(dto.startDate instanceof Date) || isNaN(dto.startDate.getTime())) {
				return err(new Error('Invalid startDate'));
			}
			if (!(dto.endDate instanceof Date) || isNaN(dto.endDate.getTime())) {
				return err(new Error('Invalid endDate'));
			}
			if (
				dto.scanChainInitDate &&
				(!(dto.scanChainInitDate instanceof Date) ||
					isNaN(dto.scanChainInitDate.getTime()))
			) {
				return err(new Error('Invalid scanChainInitDate'));
			}

			// Validate numbers
			if (
				!Number.isInteger(dto.latestVerifiedLedger) ||
				dto.latestVerifiedLedger < 0
			) {
				return err(
					new Error('latestVerifiedLedger must be a positive integer')
				);
			}
			if (
				!Number.isInteger(dto.latestScannedLedger) ||
				dto.latestScannedLedger < 0
			) {
				return err(new Error('latestScannedLedger must be a positive integer'));
			}
			if (!Number.isInteger(dto.concurrency) || dto.concurrency < 0) {
				return err(new Error('concurrency must be a positive integer'));
			}

			// Map error if present
			const error = dto.error ? this.mapToScanError(dto.error) : null;
			if (error && error.isErr()) return err(error.error);

			// Convert baseUrl string to Url instance
			const baseUrlResult = Url.create(dto.baseUrl);
			if (baseUrlResult.isErr()) {
				return err(new Error('Invalid baseUrl format'));
			}
			const baseUrl = baseUrlResult.value;

			// Validate headerHash if present
			if (
				dto.latestScannedLedgerHeaderHash !== null &&
				typeof dto.latestScannedLedgerHeaderHash !== 'string'
			) {
				return err(
					new Error('latestScannedLedgerHeaderHash must be null or string')
				);
			}

			return ok(
				new Scan(
					dto.scanChainInitDate,
					dto.startDate,
					dto.endDate,
					baseUrl,
					dto.fromLedger,
					dto.toLedger,
					dto.latestScannedLedger,
					dto.latestScannedLedgerHeaderHash,
					dto.concurrency,
					dto.isSlowArchive,
					error ? error.value : null
				)
			);
		} catch (e) {
			return err(
				new Error(
					`Failed to map RegisterScanDTO to Scan: ${e instanceof Error ? e.message : String(e)}`
				)
			);
		}
	}

	private mapToScanError(errorDTO: ScanErrorDTO): Result<ScanError, Error> {
		// Validate required fields
		if (!errorDTO.url || typeof errorDTO.url !== 'string') {
			return err(new Error('Error URL must be a string'));
		}
		if (!errorDTO.message || typeof errorDTO.message !== 'string') {
			return err(new Error('Error message must be a string'));
		}

		// Map error type string to enum
		const errorType = this.mapErrorType(errorDTO.type);
		if (errorType === undefined) {
			return err(new Error(`Invalid error type: ${errorDTO.type}`));
		}

		return ok(new ScanError(errorType, errorDTO.url, errorDTO.message));
	}

	private mapErrorType(type: string): ScanErrorType | undefined {
		switch (type) {
			case 'TYPE_VERIFICATION':
				return ScanErrorType.TYPE_VERIFICATION;
			case 'TYPE_CONNECTION':
				return ScanErrorType.TYPE_CONNECTION;
			default:
				return undefined;
		}
	}

	private isValidScanErrorDTO(error: ScanErrorDTO): boolean {
		return (
			typeof error.type === 'string' &&
			typeof error.url === 'string' &&
			typeof error.message === 'string' &&
			Object.values(ScanErrorType).includes(error.type)
		);
	}
}
