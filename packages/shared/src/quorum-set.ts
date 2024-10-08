export interface BaseQuorumSet {
	threshold: number;
	validators: Array<string>;
	innerQuorumSets: Array<BaseQuorumSet>;
}

export class QuorumSet implements BaseQuorumSet {
	public threshold: number;
	public validators: Array<string>;
	public innerQuorumSets: Array<QuorumSet>;

	constructor(
		threshold: number = Number.MAX_SAFE_INTEGER,
		validators: Array<string> = [],
		innerQuorumSets: Array<QuorumSet> = []
	) {
		this.threshold = threshold;
		this.validators = validators;
		this.innerQuorumSets = innerQuorumSets;
	}

	hasValidators() {
		return this.validators.length > 0 || this.innerQuorumSets.length > 0;
	}

	static getAllValidators(qs: QuorumSet): Array<string> {
		return qs.innerQuorumSets.reduce(
			(allValidators, innerQS) =>
				allValidators.concat(QuorumSet.getAllValidators(innerQS)),
			qs.validators
		);
	}

	toJSON(): Record<string, unknown> {
		return {
			threshold: this.threshold,
			validators: Array.from(this.validators),
			innerQuorumSets: Array.from(this.innerQuorumSets)
		};
	}

	static fromBaseQuorumSet(quorumSetObject: BaseQuorumSet): QuorumSet {
		return new QuorumSet(
			quorumSetObject.threshold,
			quorumSetObject.validators,
			quorumSetObject.innerQuorumSets.map(
				(innerQuorumSet) => this.fromBaseQuorumSet(innerQuorumSet)
			)
		);
	}
}
