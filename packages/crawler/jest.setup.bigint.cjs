// Jest sends test results from worker processes to the parent by JSON
// serialization, and JSON.stringify throws on BigInt. Crawl results carry
// bigint ledger sequences, so a *failing* assertion on a CrawlResult crashes
// the reporter with "Do not know how to serialize a BigInt" and the actual
// assertion diff is never printed - the suite just reports "failed to run".
//
// That masked a real failure in CI: the diff was only visible by running with
// --runInBand, which bypasses worker serialization entirely.
//
// Giving BigInt a toJSON makes the reporter able to describe these values, so
// the real error surfaces. Test environment only.
if (typeof BigInt !== 'undefined' && !('toJSON' in BigInt.prototype)) {
	Object.defineProperty(BigInt.prototype, 'toJSON', {
		configurable: true,
		writable: true,
		value: function toJSON() {
			return this.toString();
		}
	});
}
