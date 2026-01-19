import { ScanMapper } from '../ScanMapper';
import { ScanDTO, ScanErrorDTO } from 'history-scanner-dto';
import { ScanError, ScanErrorType, ScanErrorCategory } from '../../../domain/scan/ScanError';

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
			errors: [],
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
				message: 'Test error',
				count: 1,
				category: 'OTHER'
			};
			const dtoWithErrors = { ...validScanDTO, errors: [validErrorDTO] };
			const result = mapper.toDomain(dtoWithErrors);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.errors[0]).toBeInstanceOf(ScanError);
			}
		});

		it('should fail with invalid error DTO', () => {
			const invalidErrorDTO = {
				type: 'INVALID_TYPE',
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithErrors = { ...validScanDTO, errors: [invalidErrorDTO] };
			const result = mapper.toDomain(dtoWithErrors);
			expect(result.isErr()).toBe(true);
		});

		it('should handle valid error DTO with string type TYPE_VERIFICATION', () => {
			const validErrorDTO: ScanErrorDTO = {
				type: 'TYPE_VERIFICATION', // String from REST API
				url: 'https://test.com',
				message: 'Test error',
				count: 1,
				category: 'OTHER'
			};
			const dtoWithErrors = { ...validScanDTO, errors: [validErrorDTO] };
			const result = mapper.toDomain(dtoWithErrors);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.errors[0]).toBeInstanceOf(ScanError);
				expect(result.value.errors[0]?.type).toBe(ScanErrorType.TYPE_VERIFICATION);
			}
		});

		it('should handle valid error DTO with string type TYPE_CONNECTION', () => {
			const validErrorDTO: ScanErrorDTO = {
				type: 'TYPE_CONNECTION', // String from REST API
				url: 'https://test.com',
				message: 'Test error',
				count: 1,
				category: 'CONNECTION'
			};
			const dtoWithErrors = { ...validScanDTO, errors: [validErrorDTO] };
			const result = mapper.toDomain(dtoWithErrors);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.errors[0]).toBeInstanceOf(ScanError);
				expect(result.value.errors[0]?.type).toBe(ScanErrorType.TYPE_CONNECTION);
			}
		});

		it('should fail with invalid error type string', () => {
			const invalidErrorDTO = {
				type: 'INVALID_TYPE', // Unknown error type
				url: 'https://test.com',
				message: 'Test error'
			};
			const dtoWithErrors = { ...validScanDTO, errors: [invalidErrorDTO] };
			const result = mapper.toDomain(dtoWithErrors);
			expect(result.isErr()).toBe(true);
			if (result.isErr()) {
				expect(result.error.message).toContain('Invalid error type');
			}
		});

		describe('error category mapping', () => {
			it('should map TRANSACTION_SET_HASH category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: '100 transaction set hash mismatches',
					count: 100,
					category: 'TRANSACTION_SET_HASH'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.TRANSACTION_SET_HASH);
					expect(result.value.errors[0].count).toBe(100);
				}
			});

			it('should map TRANSACTION_RESULT_HASH category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: '50 transaction result hash mismatches',
					count: 50,
					category: 'TRANSACTION_RESULT_HASH'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.TRANSACTION_RESULT_HASH);
				}
			});

			it('should map LEDGER_HEADER_HASH category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: '25 ledger header hash mismatches',
					count: 25,
					category: 'LEDGER_HEADER_HASH'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.LEDGER_HEADER_HASH);
				}
			});

			it('should map BUCKET_HASH category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: '10 bucket hash mismatches',
					count: 10,
					category: 'BUCKET_HASH'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.BUCKET_HASH);
				}
			});

			it('should map MISSING_FILE category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: '5 missing files',
					count: 5,
					category: 'MISSING_FILE'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.MISSING_FILE);
				}
			});

			it('should map CONNECTION category correctly', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_CONNECTION',
					url: 'https://test.com',
					message: 'Connection timeout',
					count: 1,
					category: 'CONNECTION'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.CONNECTION);
				}
			});

			it('should default to OTHER when category is missing', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: 'Test error',
					count: 1,
					category: undefined as any
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.OTHER);
				}
			});

			it('should default to OTHER when category is unknown', () => {
				const errorDTO: ScanErrorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: 'Test error',
					count: 1,
					category: 'UNKNOWN_CATEGORY'
				};
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.OTHER);
				}
			});

			it('should default count to 1 when count is missing', () => {
				const errorDTO = {
					type: 'TYPE_VERIFICATION',
					url: 'https://test.com',
					message: 'Test error',
					category: 'OTHER'
				} as ScanErrorDTO;
				const dtoWithErrors = { ...validScanDTO, errors: [errorDTO] };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors[0].count).toBe(1);
				}
			});

			it('should handle multiple errors with different categories', () => {
				const errorDTOs: ScanErrorDTO[] = [
					{
						type: 'TYPE_VERIFICATION',
						url: 'https://test.com',
						message: '100 tx set errors',
						count: 100,
						category: 'TRANSACTION_SET_HASH'
					},
					{
						type: 'TYPE_VERIFICATION',
						url: 'https://test.com',
						message: '50 ledger header errors',
						count: 50,
						category: 'LEDGER_HEADER_HASH'
					},
					{
						type: 'TYPE_VERIFICATION',
						url: 'https://test.com',
						message: '25 bucket errors',
						count: 25,
						category: 'BUCKET_HASH'
					}
				];
				const dtoWithErrors = { ...validScanDTO, errors: errorDTOs };
				const result = mapper.toDomain(dtoWithErrors);
				expect(result.isOk()).toBe(true);
				if (result.isOk()) {
					expect(result.value.errors).toHaveLength(3);
					expect(result.value.errors[0].category).toBe(ScanErrorCategory.TRANSACTION_SET_HASH);
					expect(result.value.errors[0].count).toBe(100);
					expect(result.value.errors[1].category).toBe(ScanErrorCategory.LEDGER_HEADER_HASH);
					expect(result.value.errors[1].count).toBe(50);
					expect(result.value.errors[2].category).toBe(ScanErrorCategory.BUCKET_HASH);
					expect(result.value.errors[2].count).toBe(25);
				}
			});
		});
	});
});
