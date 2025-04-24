import { Network, NetworkV1 } from 'shared';
import { inject, injectable } from 'inversify';
import { Result } from 'neverthrow';
import { GetNetworkDTO } from './GetNetworkDTO';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import 'reflect-metadata';
import { NetworkDTOService } from '../../services/NetworkDTOService';
import { CachedNetworkDTOService } from '../../services/CachedNetworkDTOService';

@injectable()
export class GetNetwork {
	constructor(
		private readonly networkDTOService: CachedNetworkDTOService,
		@inject('ExceptionLogger') protected exceptionLogger: ExceptionLogger
	) {}

	async execute(dto: GetNetworkDTO): Promise<Result<NetworkV1 | null, Error>> {
		console.log('Debug: GetNetwork.execute called with dto:', dto);
		let networkOrError: Result<NetworkV1 | null, Error>;
		if (dto.at === undefined) {
			console.log('Debug: Getting latest network DTO');
			networkOrError = await this.networkDTOService.getLatestNetworkDTO();
		} else {
			console.log('Debug: Getting network DTO at:', dto.at);
			networkOrError = await this.networkDTOService.getNetworkDTOAt(dto.at);
		}

		if (networkOrError.isErr()) {
			console.log('Debug: Error getting network:', networkOrError.error);
			this.exceptionLogger.captureException(networkOrError.error);
		} else {
			console.log('Debug: Network result:', networkOrError.value ? 'found' : 'not found');
		}

		return networkOrError;
	}
}
