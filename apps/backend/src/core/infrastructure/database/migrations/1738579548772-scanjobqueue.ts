import { MigrationInterface, QueryRunner } from 'typeorm';

export class Scanjobqueue1738579548772 implements MigrationInterface {
	name = 'Scanjobqueue1738579548772';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "history_archive_scan_job_queue" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "latestScannedLedger" integer NOT NULL DEFAULT '0', "latestScannedLedgerHeaderHash" character varying, "chainInitDate" TIMESTAMP, "status" character varying NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b136e9f9a8b433b3f7d90fd2af0" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE INDEX "idx_scanjob_url" ON "history_archive_scan_job_queue" ("url") `
		);
		await queryRunner.query(
			`CREATE INDEX "idx_scanjob_status" ON "history_archive_scan_job_queue" ("status") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_scanjob_status"`);
		await queryRunner.query(`DROP INDEX "public"."idx_scanjob_url"`);
		await queryRunner.query(`DROP TABLE "history_archive_scan_job_queue"`);
	}
}
