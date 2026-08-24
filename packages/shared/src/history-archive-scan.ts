import {HistoryArchiveScanV1} from "./dto/history-archive-scan-v1";

export interface HistoryArchiveScanError {
    url: string;
    message: string;
    count: number;
    category: string;
    firstLedger: number | null;
    lastLedger: number | null;
}

// Reported by the scanner when it could not process an entry at all - for
// example when its hasher is a protocol behind the network. It says nothing
// about the archive, so it must never drive a repair prompt.
export const SCANNER_ERROR_CATEGORY = 'SCANNER_ERROR';

export class HistoryArchiveScan {
    constructor(
        public readonly url: string,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly latestVerifiedLedger: number,
        public readonly hasError: boolean,
        public readonly errors: HistoryArchiveScanError[],
        public readonly isSlow: boolean
    ) {
    }

    // Defects in the archive itself. Only these justify asking an operator to
    // repair.
    get archiveErrors(): HistoryArchiveScanError[] {
        return this.errors.filter(e => e.category !== SCANNER_ERROR_CATEGORY);
    }

    // Faults on Radar's side while scanning.
    get scannerErrors(): HistoryArchiveScanError[] {
        return this.errors.filter(e => e.category === SCANNER_ERROR_CATEGORY);
    }

    get hasArchiveError(): boolean {
        return this.archiveErrors.length > 0;
    }

    static fromHistoryArchiveScanV1(historyArchiveScanV1DTO: HistoryArchiveScanV1): HistoryArchiveScan {
        return new HistoryArchiveScan(
            historyArchiveScanV1DTO.url,
            new Date(historyArchiveScanV1DTO.startDate),
            new Date(historyArchiveScanV1DTO.endDate),
            historyArchiveScanV1DTO.latestVerifiedLedger,
            historyArchiveScanV1DTO.hasError,
            historyArchiveScanV1DTO.errors.map(e => ({
                url: e.url,
                message: e.message,
                count: e.count,
                category: e.category,
                firstLedger: e.firstLedger ?? null,
                lastLedger: e.lastLedger ?? null
            })),
            historyArchiveScanV1DTO.isSlow
        );
    }
}
