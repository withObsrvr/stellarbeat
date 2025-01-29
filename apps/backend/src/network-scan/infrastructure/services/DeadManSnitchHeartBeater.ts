import { inject, injectable } from 'inversify';
import { Url, HttpService } from 'http-helper';
import { err, ok, Result } from 'neverthrow';
import { CustomError } from 'custom-error';
import { HeartBeater } from '../../../core/services/HeartBeater';

@injectable()
export class DeadManSnitchHeartBeater implements HeartBeater {
	constructor(
		@inject('HttpService') protected httpService: HttpService,
		protected url: Url
	) {
		this.url = url;
		this.httpService = httpService;
	}

	async tick(): Promise<Result<void, Error>> {
		const result = await this.httpService.get(this.url);
		if (result.isOk()) return ok(undefined);

		return err(
			new CustomError('Heartbeat tick failed', 'HeartbeatError', result.error)
		);
	}
}
