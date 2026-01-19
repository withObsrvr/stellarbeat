import { ScanError, ScanErrorType, ScanErrorCategory } from '../ScanError';

describe('ScanError', () => {
	describe('constructor', () => {
		it('should create error with all parameters', () => {
			const error = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'100 transaction set hash mismatches',
				100,
				ScanErrorCategory.TRANSACTION_SET_HASH
			);

			expect(error.type).toBe(ScanErrorType.TYPE_VERIFICATION);
			expect(error.url).toBe('https://test.com');
			expect(error.message).toBe('100 transaction set hash mismatches');
			expect(error.count).toBe(100);
			expect(error.category).toBe(ScanErrorCategory.TRANSACTION_SET_HASH);
			expect(error.name).toBe('ScanError');
		});

		it('should create error with default count', () => {
			const error = new ScanError(
				ScanErrorType.TYPE_CONNECTION,
				'https://test.com',
				'Connection failed'
			);

			expect(error.count).toBe(1);
		});

		it('should create error with default category', () => {
			const error = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Generic error'
			);

			expect(error.category).toBe(ScanErrorCategory.OTHER);
		});

		it('should create error with default count and category', () => {
			const error = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Test error'
			);

			expect(error.count).toBe(1);
			expect(error.category).toBe(ScanErrorCategory.OTHER);
		});
	});

	describe('ScanErrorType enum', () => {
		it('should have TYPE_VERIFICATION', () => {
			expect(ScanErrorType.TYPE_VERIFICATION).toBeDefined();
		});

		it('should have TYPE_CONNECTION', () => {
			expect(ScanErrorType.TYPE_CONNECTION).toBeDefined();
		});
	});

	describe('ScanErrorCategory enum', () => {
		it('should have TRANSACTION_SET_HASH', () => {
			expect(ScanErrorCategory.TRANSACTION_SET_HASH).toBe('TRANSACTION_SET_HASH');
		});

		it('should have TRANSACTION_RESULT_HASH', () => {
			expect(ScanErrorCategory.TRANSACTION_RESULT_HASH).toBe('TRANSACTION_RESULT_HASH');
		});

		it('should have LEDGER_HEADER_HASH', () => {
			expect(ScanErrorCategory.LEDGER_HEADER_HASH).toBe('LEDGER_HEADER_HASH');
		});

		it('should have BUCKET_HASH', () => {
			expect(ScanErrorCategory.BUCKET_HASH).toBe('BUCKET_HASH');
		});

		it('should have MISSING_FILE', () => {
			expect(ScanErrorCategory.MISSING_FILE).toBe('MISSING_FILE');
		});

		it('should have CONNECTION', () => {
			expect(ScanErrorCategory.CONNECTION).toBe('CONNECTION');
		});

		it('should have OTHER', () => {
			expect(ScanErrorCategory.OTHER).toBe('OTHER');
		});
	});

	describe('equals', () => {
		it('should return true for equal errors', () => {
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Same error',
				10,
				ScanErrorCategory.BUCKET_HASH
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Same error',
				10,
				ScanErrorCategory.BUCKET_HASH
			);

			expect(error1.equals(error2)).toBe(true);
		});

		it('should return false for different types', () => {
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error',
				1,
				ScanErrorCategory.OTHER
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_CONNECTION,
				'https://test.com',
				'Error',
				1,
				ScanErrorCategory.OTHER
			);

			expect(error1.equals(error2)).toBe(false);
		});

		it('should return false for different urls', () => {
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test1.com',
				'Error',
				1,
				ScanErrorCategory.OTHER
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test2.com',
				'Error',
				1,
				ScanErrorCategory.OTHER
			);

			expect(error1.equals(error2)).toBe(false);
		});

		it('should return false for different messages', () => {
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error 1',
				1,
				ScanErrorCategory.OTHER
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error 2',
				1,
				ScanErrorCategory.OTHER
			);

			expect(error1.equals(error2)).toBe(false);
		});

		it('should return false for different categories', () => {
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error',
				1,
				ScanErrorCategory.BUCKET_HASH
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error',
				1,
				ScanErrorCategory.LEDGER_HEADER_HASH
			);

			expect(error1.equals(error2)).toBe(false);
		});

		it('should ignore count differences in equals comparison', () => {
			// Note: The equals method does NOT compare count, which allows
			// errors to be considered "equal" even with different counts
			const error1 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error',
				10,
				ScanErrorCategory.OTHER
			);
			const error2 = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Error',
				20,
				ScanErrorCategory.OTHER
			);

			// Count is not part of the equals comparison
			expect(error1.equals(error2)).toBe(true);
		});
	});

	describe('Error interface implementation', () => {
		it('should implement Error interface with name property', () => {
			const error = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Test error'
			);

			expect(error.name).toBe('ScanError');
			expect(error.message).toBe('Test error');
		});

		it('should be usable as Error type', () => {
			const error: Error = new ScanError(
				ScanErrorType.TYPE_VERIFICATION,
				'https://test.com',
				'Test error'
			);

			expect(error.name).toBe('ScanError');
			expect(error.message).toBe('Test error');
		});
	});
});
