export interface AnalysisMergedResult {
	blockingSetsMinSize: number;
	blockingSetsFilteredMinSize: number;
	//network-wide: the smallest set that can split ANY two nodes, including
	//separating an outlying node from the core.
	//undefined when python-fbas reports no splitting set at all, which means
	//safety cannot be broken at this grouping -- emphatically not zero.
	splittingSetsMinSize?: number;
	//restricted to the top tier: the smallest set that can split the core
	//itself. Always >= splittingSetsMinSize, and the two answer different
	//questions -- see the verdict block copy.
	//undefined when the analyzer in use does not compute it (the legacy Rust
	//facade does not), which is not the same as zero.
	splittingSetsTopTierMinSize?: number;
	topTierSize: number;
}
