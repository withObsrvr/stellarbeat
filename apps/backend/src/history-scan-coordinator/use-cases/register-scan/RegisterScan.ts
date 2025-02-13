import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/di/di-types';
import { ExceptionLogger } from 'exception-logger';
import { err, ok, Result } from 'neverthrow';
import { ScanMapper } from '../../infrastructure/mappers/ScanMapper';
import { ScanRepository } from '../../domain/scan/ScanRepository';
import { mapUnknownToError } from '../../../core/utilities/mapUnknownToError';
import { ScanDTO } from 'history-scanner-dto';
import { Logger } from 'logger';
import { ScanJobRepository } from '../../domain/ScanJobRepository';

@injectable()
export class RegisterScan {
	constructor(
		private mapper: ScanMapper,
		@inject(TYPES.HistoryArchiveScanRepository)
		private scanRepository: ScanRepository,
		@inject(TYPES.ScanJobRepository)
		private scanJobRepository: ScanJobRepository,
		@inject('ExceptionLogger') private exceptionLogger: ExceptionLogger,
		@inject('Logger') private logger: Logger
	) {}

	async execute(dto: ScanDTO): Promise<Result<void, Error>> {
		this.logger.info(`Registering scan: ${dto.baseUrl}`);
		const scanResult = this.mapper.toDomain(dto);
		if (scanResult.isErr()) {
			this.exceptionLogger.captureException(scanResult.error);
			return err(scanResult.error);
		}

		try {
			await this.scanRepository.save([scanResult.value]);
			const scanJob = await this.scanJobRepository.findByRemoteId(
				dto.scanJobRemoteId
			);
			if (scanJob === null) {
				this.logger.info(
					`No scan job found for remoteId: ${dto.scanJobRemoteId}`
				);
			} else {
				scanJob.status = 'DONE';
				await this.scanJobRepository.save([scanJob]);
			}

			this.logger.info(`Scan registered: ${scanResult.value.baseUrl.value}`);
		} catch (e) {
			const error = mapUnknownToError(e);
			this.exceptionLogger.captureException(error);
			return err(error);
		}

		return ok(undefined);
	}
}
