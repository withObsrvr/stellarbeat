import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/di-types';
import { ExceptionLogger } from 'exception-logger';
import { ScanDTO } from './ScanDTO';
import { err, ok, Result } from 'neverthrow';
import { ScanMapper } from '../../infrastructure/mappers/ScanMapper';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { mapUnknownToError } from '../../../core/utilities/mapUnknownToError';

@injectable()
export class RegisterScan {
	constructor(
		private mapper: ScanMapper,
		@inject(TYPES.HistoryArchiveScanRepository)
		private scanRepository: ScanRepository,
		@inject('ExceptionLogger') private exceptionLogger: ExceptionLogger
	) {}

	async execute(dto: ScanDTO): Promise<Result<void, Error>> {
		const scanResult = this.mapper.toDomain(dto);
		if (scanResult.isErr()) {
			return err(scanResult.error);
		}

		try {
			await this.scanRepository.save([scanResult.value]);
		} catch (e) {
			const error = mapUnknownToError(e);
			this.exceptionLogger.captureException(error);
			return err(error);
		}

		return ok(undefined);
	}
}
