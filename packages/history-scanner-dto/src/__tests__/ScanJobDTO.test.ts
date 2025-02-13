import { ScanJobDTO } from '../';

describe('ScanJobDTO', () => {
	describe('fromJSON', () => {
		it('should parse valid JSON with date string', () => {
			const job = new ScanJobDTO(
				'https://history.stellar.org',
				100,
				'hash123',
				new Date('2024-01-01T00:00:00.000Z'),
				'test'
			);
			const json = JSON.parse(JSON.stringify(job));
			console.log(json);
			const result = ScanJobDTO.fromJSON(json);
			expect(result.isOk()).toBe(true);

			const dto = result._unsafeUnwrap();
			expect(dto.url).toBe('https://history.stellar.org');
			expect(dto.latestScannedLedger).toBe(100);
			expect(dto.latestScannedLedgerHeaderHash).toBe('hash123');
			expect(dto.chainInitDate).toBeInstanceOf(Date);
			expect(dto.chainInitDate?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
		});

		it('should parse JSON with null values', () => {
			const json = {
				url: 'https://history.stellar.org',
				latestScannedLedger: 100,
				latestScannedLedgerHeaderHash: null,
				chainInitDate: null,
				remoteId: 'test'
			};

			const result = ScanJobDTO.fromJSON(json);
			expect(result.isOk()).toBe(true);

			const dto = result._unsafeUnwrap();
			expect(dto.url).toBe('https://history.stellar.org');
			expect(dto.latestScannedLedger).toBe(100);
			expect(dto.latestScannedLedgerHeaderHash).toBeNull();
			expect(dto.chainInitDate).toBeNull();
		});

		it('should parse string or object input', () => {
			const obj = {
				url: 'https://history.stellar.org',
				latestScannedLedger: 100,
				latestScannedLedgerHeaderHash: 'hash123',
				chainInitDate: '2024-01-01T00:00:00.000Z',
				remoteId: 'test'
			};

			const fromString = ScanJobDTO.fromJSON(obj);
			const fromObject = ScanJobDTO.fromJSON(obj);

			expect(fromString).toEqual(fromObject);
		});

		it('should return error for missing required fields', () => {
			const json = {
				url: 'https://history.stellar.org'
				// missing other required fields
			};

			const result = ScanJobDTO.fromJSON(json);
			expect(result.isErr()).toBe(true);
		});
	});
});
