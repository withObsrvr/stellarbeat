export class QuorumSet {
	//immutablity is importand for usage in votes!
	constructor(
		public readonly threshold: number,
		public readonly validators: ReadonlyArray<string>,
		public readonly innerQuorumSets: QuorumSet[]
	) {}

	toJSON(): Record<string, unknown> {
		return {
			threshold: this.threshold,
			validators: this.validators,
			innerQuorumSets: this.innerQuorumSets.map((q) => q.toJSON())
		};
	}

	static fromJSON(json: Record<string, unknown>): QuorumSet {
		return new QuorumSet(
			json.threshold as number,
			json.validators as ReadonlyArray<string>,
			(json.innerQuorumSets as Record<string, unknown>[]).map((q) =>
				this.fromJSON(q as Record<string, unknown>)
			)
		);
	}
}
