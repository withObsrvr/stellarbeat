import { inject, injectable } from 'inversify';
import { ConnectionAttempt, probeOverlayEndpoint } from 'crawler';
import { Config } from '../../../../core/config/Config';
import { Logger } from '../../../../core/services/Logger';

@injectable()
export class EndpointProbeService {
	constructor(
		@inject('Config') private config: Config,
		@inject('Logger') private logger: Logger
	) {}

	async probe(ip: string, port: number): Promise<ConnectionAttempt> {
		return await probeOverlayEndpoint(
			this.config.crawlerConfig.nodeConfig,
			ip,
			port,
			this.logger.getRawLogger(),
			{ timeoutMs: this.config.endpointProbeTimeoutMs }
		);
	}
}
