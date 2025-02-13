import { ScanDTO } from '../ScanDTO';

describe('ScanDTO', () => {
	describe('fromJSON', () => {
		it('should parse valid JSON with all fields', () => {
			const json = {
				startDate: '2024-01-01T00:00:00.000Z',
				endDate: '2024-01-01T01:00:00.000Z',
				baseUrl: 'https://history.stellar.org',
				scanChainInitDate: '2024-01-01T00:00:00.000Z',
				fromLedger: 1,
				toLedger: 100,
				latestVerifiedLedger: 90,
				latestScannedLedger: 95,
				latestScannedLedgerHeaderHash: 'hash123',
				concurrency: 5,
				isSlowArchive: false,
				error: null,
				scanJobRemoteId: 'test'
			};

			const result = ScanDTO.fromJSON(json);
			expect(result.isOk()).toBe(true);
			if (!result.isOk()) throw result.error;

			const dto = result.value;
			expect(dto.startDate).toBeInstanceOf(Date);
			expect(dto.startDate.toISOString()).toBe('2024-01-01T00:00:00.000Z');
			expect(dto.endDate).toBeInstanceOf(Date);
			expect(dto.endDate.toISOString()).toBe('2024-01-01T01:00:00.000Z');
			expect(dto.baseUrl).toBe('https://history.stellar.org');
			expect(dto.scanChainInitDate).toBeInstanceOf(Date);
			expect(dto.fromLedger).toBe(1);
			expect(dto.toLedger).toBe(100);
			expect(dto.latestVerifiedLedger).toBe(90);
			expect(dto.latestScannedLedger).toBe(95);
			expect(dto.latestScannedLedgerHeaderHash).toBe('hash123');
			expect(dto.concurrency).toBe(5);
			expect(dto.isSlowArchive).toBe(false);
			expect(dto.error).toBeNull();
			expect(dto.scanJobRemoteId).toBe('test');
		});

		it('should parse JSON with null optional fields', () => {
			const json = {
				startDate: '2024-01-01T00:00:00.000Z',
				endDate: '2024-01-01T01:00:00.000Z',
				baseUrl: 'https://history.stellar.org',
				scanChainInitDate: '2024-01-01T00:00:00.000Z',
				fromLedger: 1,
				toLedger: null,
				latestVerifiedLedger: 90,
				latestScannedLedger: 95,
				latestScannedLedgerHeaderHash: null,
				concurrency: 5,
				isSlowArchive: null,
				error: null,
				scanJobRemoteId: 'test'
			};

			const result = ScanDTO.fromJSON(json);
			expect(result.isOk()).toBe(true);
			if (!result.isOk()) throw result.error;

			const dto = result.value;
			expect(dto.toLedger).toBeNull();
			expect(dto.latestScannedLedgerHeaderHash).toBeNull();
			expect(dto.isSlowArchive).toBeNull();
		});

		it('should parse JSON with error object', () => {
			const json = {
				startDate: '2024-01-01T00:00:00.000Z',
				endDate: '2024-01-01T01:00:00.000Z',
				baseUrl: 'https://history.stellar.org',
				scanChainInitDate: '2024-01-01T00:00:00.000Z',
				fromLedger: 1,
				toLedger: 100,
				latestVerifiedLedger: 90,
				latestScannedLedger: 95,
				latestScannedLedgerHeaderHash: 'hash123',
				concurrency: 5,
				isSlowArchive: false,
				error: {
					type: 'validation',
					url: 'https://history.stellar.org',
					message: 'Invalid checksum'
				},
				scanJobRemoteId: 'test'
			};

			const result = ScanDTO.fromJSON(json);
			expect(result.isOk()).toBe(true);
			if (!result.isOk()) throw result.error;

			const dto = result.value;
			expect(dto.error).toEqual({
				type: 'validation',
				url: 'https://history.stellar.org',
				message: 'Invalid checksum'
			});
		});

		it('should return error for missing required fields', () => {
			const json = {
				startDate: '2024-01-01T00:00:00.000Z'
			};

			const result = ScanDTO.fromJSON(json);
			expect(result.isErr()).toBe(true);
		});
	});
});
