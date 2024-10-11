import { HistoryArchiveScan } from "shared";

export interface HistoryArchiveScanRepository {
  get apiBaseUrl(): string;
  findLatest(url: string): Promise<HistoryArchiveScan | null>;
}
