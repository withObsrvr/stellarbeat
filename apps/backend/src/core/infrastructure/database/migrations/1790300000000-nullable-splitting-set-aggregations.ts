import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NullableSplittingSets1790200000000 let "no splitting set exists" be null on
 * network_measurement, but left the day and month aggregates NOT NULL. The
 * rollup aggregates those columns with min/max/sum, all of which return null
 * when every scan in the window reported no splitting set, so the insert failed
 * with:
 *
 *   null value in column "minSplittingSetISPMin" of relation
 *   "network_measurement_day" violates not-null constraint
 *
 * and the whole rollup was abandoned. Null has to mean the same thing in the
 * aggregates as it does at the source.
 *
 * Only the grouped variants are involved. minSplittingSetSize stayed NOT NULL
 * in the earlier migration, so minSplittingSetMin/Max/Sum stay NOT NULL here.
 */
const columns = [
	'minSplittingSetOrgsMin',
	'minSplittingSetOrgsMax',
	'minSplittingSetOrgsSum',
	'minSplittingSetCountryMin',
	'minSplittingSetCountryMax',
	'minSplittingSetCountrySum',
	'minSplittingSetISPMin',
	'minSplittingSetISPMax',
	'minSplittingSetISPSum'
];

const tables = ['network_measurement_day', 'network_measurement_month'];

export class NullableSplittingSetAggregations1790300000000
	implements MigrationInterface
{
	name = 'NullableSplittingSetAggregations1790300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const table of tables) {
			for (const column of columns) {
				await queryRunner.query(
					`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`
				);
				await queryRunner.query(
					`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`
				);
			}
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		for (const table of tables) {
			for (const column of columns) {
				await queryRunner.query(
					`UPDATE "${table}" SET "${column}" = 0 WHERE "${column}" IS NULL`
				);
				await queryRunner.query(
					`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT 0`
				);
				await queryRunner.query(
					`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL`
				);
			}
		}
	}
}
