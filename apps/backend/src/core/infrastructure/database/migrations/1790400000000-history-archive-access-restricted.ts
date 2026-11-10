import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryArchiveAccessRestricted1790400000000
	implements MigrationInterface
{
	name = 'HistoryArchiveAccessRestricted1790400000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "historyArchiveAccessRestricted" boolean NOT NULL DEFAULT false`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_day_v2" ADD "historyArchiveAccessRestrictedCount" smallint NOT NULL DEFAULT 0`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "node_measurement_day_v2" DROP COLUMN "historyArchiveAccessRestrictedCount"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "historyArchiveAccessRestricted"`
		);
	}
}
