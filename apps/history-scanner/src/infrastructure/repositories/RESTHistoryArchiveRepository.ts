import { HistoryArchiveRepository } from '../../domain/history-archive/HistoryArchiveRepository';
import { ok, Result } from 'neverthrow';
import { isString } from 'shared';
import { injectable } from 'inversify';
import 'reflect-metadata';
import { Url } from 'http-helper';

@injectable()
export class RESTHistoryArchiveRepository implements HistoryArchiveRepository {
	constructor() {}

	async getHistoryArchiveUrls(): Promise<Result<Url[], Error>> {
		const nodes: { historyUrl: string | undefined }[] = [];
		return ok(
			nodes
				.map((node) => node.historyUrl)
				.filter((url): url is string => isString(url))
				.map((urlString) => {
					const url = Url.create(urlString);
					if (url.isErr()) return undefined;
					return url.value;
				})
				.filter((url): url is Url => url instanceof Url)
		);
	}
}
