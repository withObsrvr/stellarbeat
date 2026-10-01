import { bigIntToNumber } from '../ScanError';

describe('bigIntToNumber transformer', () => {
	it('converts the string postgres returns for bigint into a number', () => {
		//regression: the API returned firstLedger as "57434879" while count came
		//back as a number, so callers comparing ledgers got string comparisons
		expect(bigIntToNumber.from('57434879')).toEqual(57434879);
		expect(typeof bigIntToNumber.from('57434879')).toEqual('number');
	});

	it('keeps null as null', () => {
		expect(bigIntToNumber.from(null)).toBeNull();
		expect(bigIntToNumber.to(null)).toBeNull();
	});

	it('writes numbers through unchanged', () => {
		expect(bigIntToNumber.to(57434879)).toEqual(57434879);
	});
});
