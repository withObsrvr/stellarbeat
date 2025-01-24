import { Result } from 'neverthrow';
import { Url } from 'http-helper';

export interface HistoryArchiveRepository {
	getHistoryArchiveUrls(): Promise<Result<Url[], Error>>;
}
