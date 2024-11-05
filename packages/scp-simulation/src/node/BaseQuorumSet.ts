export interface BaseQuorumSet {
	readonly threshold: number;
	readonly validators: string[];
	readonly innerQuorumSets: BaseQuorumSet[];
}
