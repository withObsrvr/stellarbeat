import { Url } from 'http-helper';
import { HistoryArchiveRepository } from '../../domain/history-archive/HistoryArchiveRepository';
import { ok, Result } from 'neverthrow';

export class HistoryArchiveRepositoryMock implements HistoryArchiveRepository {
	async getHistoryArchiveUrls(): Promise<Result<Url[], Error>> {
		const urlOrError = Url.create('http://127.0.0.1:3333');
		if (urlOrError.isErr()) throw urlOrError.error;

		return Promise.resolve(ok([urlOrError.value]));
	}
}
