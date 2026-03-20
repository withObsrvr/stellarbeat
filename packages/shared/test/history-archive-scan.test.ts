import {HistoryArchiveScan} from "../src";

it('should map from json', function () {
    const url = 'https://radar.withobsrvr.com/api/v1/history';
    const startDate = '2000/01/01';
    const endDate = '2000/01/02';
    const latestVerifiedLedger = 100
    const hasError = true;
    const errorUrl = 'https://radar.withobsrvr.com/api/v1/history';
    const errorMessage = 'message';
    const isSlow = true;

    const errorCount = 1;
    const errorCategory = 'verification';

    const scanDTO = {
        url: url,
        startDate: startDate,
        endDate: endDate,
        latestVerifiedLedger: latestVerifiedLedger,
        hasError: hasError,
        errors: [{ url: errorUrl, message: errorMessage, count: errorCount, category: errorCategory }],
        isSlow: isSlow
    }

    const scan = HistoryArchiveScan.fromHistoryArchiveScanV1(scanDTO);
    expect(scan.isSlow).toEqual(isSlow);
    expect(HistoryArchiveScan.fromHistoryArchiveScanV1(scanDTO)).toEqual(new HistoryArchiveScan(url, new Date(startDate), new Date(endDate), latestVerifiedLedger, hasError, [{ url: errorUrl, message: errorMessage, count: errorCount, category: errorCategory, firstLedger: null, lastLedger: null }], isSlow));
});

it('should map from json with firstLedger and lastLedger', function () {
    const url = 'https://radar.withobsrvr.com/api/v1/history';
    const startDate = '2000/01/01';
    const endDate = '2000/01/02';
    const latestVerifiedLedger = 100
    const hasError = true;
    const errorUrl = 'https://radar.withobsrvr.com/api/v1/history';
    const errorMessage = 'message';
    const isSlow = true;

    const errorCount = 100;
    const errorCategory = 'TRANSACTION_SET_HASH';
    const firstLedger = 55999998;
    const lastLedger = 59499998;

    const scanDTO = {
        url: url,
        startDate: startDate,
        endDate: endDate,
        latestVerifiedLedger: latestVerifiedLedger,
        hasError: hasError,
        errors: [{ url: errorUrl, message: errorMessage, count: errorCount, category: errorCategory, firstLedger: firstLedger, lastLedger: lastLedger }],
        isSlow: isSlow
    }

    const scan = HistoryArchiveScan.fromHistoryArchiveScanV1(scanDTO);
    expect(scan.errors[0].firstLedger).toEqual(firstLedger);
    expect(scan.errors[0].lastLedger).toEqual(lastLedger);
});