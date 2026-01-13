import {HistoryArchiveScanV1} from "./dto/history-archive-scan-v1";

export interface HistoryArchiveScanError {
    url: string;
    message: string;
}

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

    static fromHistoryArchiveScanV1(historyArchiveScanV1DTO: HistoryArchiveScanV1): HistoryArchiveScan {
        return new HistoryArchiveScan(
            historyArchiveScanV1DTO.url,
            new Date(historyArchiveScanV1DTO.startDate),
            new Date(historyArchiveScanV1DTO.endDate),
            historyArchiveScanV1DTO.latestVerifiedLedger,
            historyArchiveScanV1DTO.hasError,
            historyArchiveScanV1DTO.errors.map(e => ({ url: e.url, message: e.message })),
            historyArchiveScanV1DTO.isSlow
        );
    }
}
