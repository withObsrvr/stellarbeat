import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * python-fbas reports "No splitting set found" when safety cannot be broken at
 * a grouping at all -- for pubnet, no set of ISPs can split the network. That
 * is the best possible answer, and storing it as 0 rendered it as the worst:
 * "0 ISPs need to fail". Null means "no such set exists"; a number means one
 * does and this is how small it can be.
 */
export class NullableSplittingSets1790200000000 implements MigrationInterface {
	name = 'NullableSplittingSets1790200000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const column of [
			'minSplittingSetOrgsSize',
			'minSplittingSetCountrySize',
			'minSplittingSetISPSize'
		]) {
			await queryRunner.query(
				`ALTER TABLE "network_measurement" ALTER COLUMN "${column}" DROP NOT NULL`
			);
			await queryRunner.query(
				`ALTER TABLE "network_measurement" ALTER COLUMN "${column}" DROP DEFAULT`
			);
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		for (const column of [
			'minSplittingSetOrgsSize',
			'minSplittingSetCountrySize',
			'minSplittingSetISPSize'
		]) {
			await queryRunner.query(
				`UPDATE "network_measurement" SET "${column}" = 0 WHERE "${column}" IS NULL`
			);
			await queryRunner.query(
				`ALTER TABLE "network_measurement" ALTER COLUMN "${column}" SET DEFAULT 0`
			);
			await queryRunner.query(
				`ALTER TABLE "network_measurement" ALTER COLUMN "${column}" SET NOT NULL`
			);
		}
	}
}
