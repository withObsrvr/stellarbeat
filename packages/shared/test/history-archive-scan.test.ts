import {HistoryArchiveScan} from "../src";

it('should map from json', function () {
    const url = 'https://history.stellarbeat.io';
    const startDate = '2000/01/01';
    const endDate = '2000/01/02';
    const latestVerifiedLedger = 100
    const hasError = true;
    const errorUrl = 'https://history.stellarbeat.io/gap';
    const errorMessage = 'message';
    const isSlow = true;

    const scanDTO = {
        url: url,
        startDate: startDate,
        endDate: endDate,
        latestVerifiedLedger: latestVerifiedLedger,
        hasError: hasError,
        errorUrl: errorUrl,
        errorMessage: errorMessage,
        isSlow: isSlow
    }

    const scan = HistoryArchiveScan.fromHistoryArchiveScanV1(scanDTO);
    expect(scan.isSlow).toEqual(isSlow);
    expect(HistoryArchiveScan.fromHistoryArchiveScanV1(scanDTO)).toEqual(new HistoryArchiveScan(url, new Date(startDate), new Date(endDate), latestVerifiedLedger, hasError, errorUrl, errorMessage, isSlow));
});