import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Radar reported a single safety threshold, computed over the top tier.
 * python-fbas reports a network-wide one, which is lower because an outlying
 * node can be separated from the core by fewer organizations than it takes to
 * split the core itself. Both are real and they answer different questions, so
 * Radar now records and displays both rather than picking one.
 */
export class TopTierSplittingSets1790100000000 implements MigrationInterface {
	name = 'TopTierSplittingSets1790100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		//Nullable, not NOT NULL DEFAULT 0: an analyzer that does not compute
		//these must leave them absent. Zero would be read downstream as "no
		//organizations are needed to split the core".
		await queryRunner.query(
			`ALTER TABLE "network_measurement" ADD "minSplittingSetTopTierSize" smallint`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement" ADD "minSplittingSetOrgsTopTierSize" smallint`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "network_measurement" DROP COLUMN "minSplittingSetOrgsTopTierSize"`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement" DROP COLUMN "minSplittingSetTopTierSize"`
		);
	}
}
