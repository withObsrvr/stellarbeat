export interface BaseQuorumSet {
	threshold: number;
	validators: string[];
	innerQuorumSets: BaseQuorumSet[];
}

export class QuorumSet implements BaseQuorumSet {
	public threshold: number;
	public validators: string[];
	public innerQuorumSets: QuorumSet[];

	constructor(
		threshold: number = Number.MAX_SAFE_INTEGER,
		validators: string[] = [],
		innerQuorumSets: QuorumSet[] = []
	) {
		this.threshold = threshold;
		this.validators = validators;
		this.innerQuorumSets = innerQuorumSets;
	}

	hasValidators() {
		return this.validators.length > 0 || this.innerQuorumSets.length > 0;
	}

	static getAllValidators(qs: QuorumSet): string[] {
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
			quorumSetObject.innerQuorumSets.map((innerQuorumSet) =>
				this.fromBaseQuorumSet(innerQuorumSet)
			)
		);
	}
}
