import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScanJobRemoteId1739436634945 implements MigrationInterface {
	name = 'ScanJobRemoteId1739436634945';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`TRUNCATE TABLE "history_archive_scan_job_queue"`);
		await queryRunner.query(`
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'history_archive_scan_job_queue_id_seq') THEN
                ALTER SEQUENCE history_archive_scan_job_queue_id_seq RESTART WITH 1;
            END IF;
        END
        $$;
    `);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" ADD "remoteId" uuid NOT NULL`
		);
		await queryRunner.query(
			`CREATE SEQUENCE IF NOT EXISTS "history_archive_scan_job_queue_id_seq" OWNED BY "history_archive_scan_job_queue"."id"`
		);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" ALTER COLUMN "id" SET DEFAULT nextval('"history_archive_scan_job_queue_id_seq"')`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "idx_scanjob_remote_id" ON "history_archive_scan_job_queue" ("remoteId") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_scanjob_remote_id"`);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" ALTER COLUMN "id" DROP DEFAULT`
		);
		await queryRunner.query(
			`DROP SEQUENCE "history_archive_scan_job_queue_id_seq"`
		);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_job_queue" DROP COLUMN "remoteId"`
		);
	}
}
