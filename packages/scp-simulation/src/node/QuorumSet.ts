export class QuorumSet {
	readonly threshold: number;
	readonly validators: string[];
	readonly innerQuorumSets: QuorumSet[];

	constructor(
		threshold: number,
		validators: string[],
		innerQuorumSets: QuorumSet[]
	) {
		this.threshold = threshold;
		this.validators = validators;
		this.innerQuorumSets = innerQuorumSets;
	}
}
