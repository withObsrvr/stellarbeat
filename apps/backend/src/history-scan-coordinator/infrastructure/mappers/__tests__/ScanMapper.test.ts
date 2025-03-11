import { ScanMapper } from '../ScanMapper';
import { ScanDTO, ScanErrorDTO } from 'history-scanner-dto';
import { ScanError, ScanErrorType } from '../../../domain/scan/ScanError';

describe('ScanMapper', () => {
	let mapper: ScanMapper;
	let validScanDTO: ScanDTO;

	beforeEach(() => {
		mapper = new ScanMapper();
		validScanDTO = {
			scanChainInitDate: new Date(),
			startDate: new Date(),
			endDate: new Date(),
			baseUrl: 'https://test.com',
			fromLedger: 1,
			toLedger: 100,
			latestScannedLedger: 50,
			latestScannedLedgerHeaderHash: 'hash123',
			latestVerifiedLedger: 49,
			concurrency: 10,
			isSlowArchive: false,
			error: null,
			scanJobRemoteId: 'remoteId'
		};
	});

	describe('toDomain', () => {
		it('should successfully map valid DTO to domain', () => {
			const result = mapper.toDomain(validScanDTO);
			expect(result.isOk()).toBe(true);
		});

		it('should fail with invalid startDate', () => {
			const invalidDTO = { ...validScanDTO, startDate: 'invalid' as any };
			const result = mapper.toDomain(invalidDTO);
			expect(result.isErr()).toBe(true);
		});

		it('should fail with invalid endDate', () => {
			const invalidDTO = { ...validScanDTO, endDate: 'invalid' as any };
			const result = mapper.toDomain(invalidDTO);
			expect(result.isErr()).toBe(true);
		});

		it('should fail with invalid scanChainInitDate', () => {
			const invalidDTO = {
				...validScanDTO,
				scanChainInitDate: 'invalid' as any
			};
			const result = mapper.toDomain(invalidDTO);
			expect(result.isErr()).toBe(true);
		});

		it('should fail with negative latestVerifiedLedger', () => {
			const invalidDTO = { ...validScanDTO, latestVerifiedLedger: -1 };
			const result = mapper.toDomain(invalidDTO);
			expect(result.isErr()).toBe(true);
		});

		it('should fail with invalid baseUrl', () => {
			const invalidDTO = { ...validScanDTO, baseUrl: 'invalid-url' };
			const result = mapper.toDomain(invalidDTO);
			expect(result.isErr()).toBe(true);
		});

		it('should handle valid error DTO', () => {
			const validErrorDTO: ScanErrorDTO = {
				type: 'TYPE_VERIFICATION',
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithError = { ...validScanDTO, error: validErrorDTO };
			const result = mapper.toDomain(dtoWithError);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.error).toBeInstanceOf(ScanError);
			}
		});

		it('should fail with invalid error DTO', () => {
			const invalidErrorDTO = {
				type: 'INVALID_TYPE',
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithError = { ...validScanDTO, error: invalidErrorDTO };
			const result = mapper.toDomain(dtoWithError);
			expect(result.isErr()).toBe(true);
		});

		it('should handle valid error DTO with string type TYPE_VERIFICATION', () => {
			const validErrorDTO: ScanErrorDTO = {
				type: 'TYPE_VERIFICATION', // String from REST API
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithError = { ...validScanDTO, error: validErrorDTO };
			const result = mapper.toDomain(dtoWithError);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.error).toBeInstanceOf(ScanError);
				expect(result.value.error?.type).toBe(ScanErrorType.TYPE_VERIFICATION);
			}
		});

		it('should handle valid error DTO with string type TYPE_CONNECTION', () => {
			const validErrorDTO: ScanErrorDTO = {
				type: 'TYPE_CONNECTION', // String from REST API
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithError = { ...validScanDTO, error: validErrorDTO };
			const result = mapper.toDomain(dtoWithError);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.error).toBeInstanceOf(ScanError);
				expect(result.value.error?.type).toBe(ScanErrorType.TYPE_CONNECTION);
			}
		});

		it('should fail with invalid error type string', () => {
			const invalidErrorDTO = {
				type: 'INVALID_TYPE', // Unknown error type
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithError = { ...validScanDTO, error: invalidErrorDTO };
			const result = mapper.toDomain(dtoWithError);
			expect(result.isErr()).toBe(true);
			if (result.isErr()) {
				expect(result.error.message).toContain('Invalid error type');
			}
		});
	});
});
