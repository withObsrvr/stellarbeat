import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryArchiveUnreachable1789000000000
	implements MigrationInterface
{
	name = 'HistoryArchiveUnreachable1789000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "historyArchiveUnreachable" boolean NOT NULL DEFAULT false`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_day_v2" ADD "historyArchiveUnreachableCount" smallint NOT NULL DEFAULT 0`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "node_measurement_day_v2" DROP COLUMN "historyArchiveUnreachableCount"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "historyArchiveUnreachable"`
		);
	}
}
