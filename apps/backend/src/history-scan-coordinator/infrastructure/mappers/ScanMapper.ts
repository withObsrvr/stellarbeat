import { Result, ok, err } from 'neverthrow';
import { injectable } from 'inversify';
import { Url } from 'http-helper';
import 'reflect-metadata';
import { Scan } from '../../domain/scan/Scan';
import { ScanError, ScanErrorType, ScanErrorCategory } from '../../domain/scan/ScanError';
import { ScanDTO, ScanErrorDTO } from 'history-scanner-dto';

@injectable()
export class ScanMapper {
	public toDomain(dto: ScanDTO): Result<Scan, Error> {
		try {
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

			const errorsResult = this.mapToScanErrors(dto.errors);
			if (errorsResult.isErr()) return err(errorsResult.error);

			const baseUrlResult = Url.create(dto.baseUrl);
			if (baseUrlResult.isErr()) {
				return err(new Error('Invalid baseUrl format'));
			}
			const baseUrl = baseUrlResult.value;

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
					errorsResult.value
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

	private mapToScanErrors(errorDTOs: ScanErrorDTO[]): Result<ScanError[], Error> {
		const errors: ScanError[] = [];
		for (const errorDTO of errorDTOs) {
			const errorResult = this.mapToScanError(errorDTO);
			if (errorResult.isErr()) return err(errorResult.error);
			errors.push(errorResult.value);
		}
		return ok(errors);
	}

	private mapToScanError(errorDTO: ScanErrorDTO): Result<ScanError, Error> {
		if (!errorDTO.url || typeof errorDTO.url !== 'string') {
			return err(new Error('Error URL must be a string'));
		}
		if (!errorDTO.message || typeof errorDTO.message !== 'string') {
			return err(new Error('Error message must be a string'));
		}

		const errorType = this.mapErrorType(errorDTO.type);
		if (errorType === undefined) {
			return err(new Error(`Invalid error type: ${errorDTO.type}`));
		}

		const errorCategory = this.mapErrorCategory(errorDTO.category);
		const count = typeof errorDTO.count === 'number' ? errorDTO.count : 1;
		const firstLedger = typeof errorDTO.firstLedger === 'number' ? errorDTO.firstLedger : null;
		const lastLedger = typeof errorDTO.lastLedger === 'number' ? errorDTO.lastLedger : null;

		return ok(new ScanError(errorType, errorDTO.url, errorDTO.message, count, errorCategory, firstLedger, lastLedger));
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

	private mapErrorCategory(category: string | undefined): ScanErrorCategory {
		if (!category) return ScanErrorCategory.OTHER;
		switch (category) {
			case 'TRANSACTION_SET_HASH':
				return ScanErrorCategory.TRANSACTION_SET_HASH;
			case 'TRANSACTION_RESULT_HASH':
				return ScanErrorCategory.TRANSACTION_RESULT_HASH;
			case 'LEDGER_HEADER_HASH':
				return ScanErrorCategory.LEDGER_HEADER_HASH;
			case 'BUCKET_HASH':
				return ScanErrorCategory.BUCKET_HASH;
			case 'MISSING_FILE':
				return ScanErrorCategory.MISSING_FILE;
			case 'CONNECTION':
				return ScanErrorCategory.CONNECTION;
			default:
				return ScanErrorCategory.OTHER;
		}
	}
}
