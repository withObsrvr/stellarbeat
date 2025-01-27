import { Result } from 'neverthrow';

export interface HistoryArchiveRepository {
	getHistoryArchiveUrls(): Promise<Result<string[], Error>>;
}
