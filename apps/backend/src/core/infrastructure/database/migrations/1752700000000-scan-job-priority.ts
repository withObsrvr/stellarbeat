import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScanJobPriority1752700000000 implements MigrationInterface {
	name = 'ScanJobPriority1752700000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" ADD "priority" integer NOT NULL DEFAULT 0`
		);
		await queryRunner.query(
			`CREATE INDEX "idx_scanjob_priority" ON "history_archive_scan_job_queue" ("priority")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_scanjob_priority"`);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" DROP COLUMN "priority"`
		);
	}
}
