import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScanErrorLedgerFields1752800000000 implements MigrationInterface {
	name = 'ScanErrorLedgerFields1752800000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add firstLedger and lastLedger columns to track error ranges
		await queryRunner.query(`
			ALTER TABLE "history_archive_scan_error"
			ADD "firstLedger" bigint NULL,
			ADD "lastLedger" bigint NULL
		`);

		// Create index for efficient range queries
		await queryRunner.query(`
			CREATE INDEX "IDX_error_ledger_range"
			ON "history_archive_scan_error" ("firstLedger", "lastLedger")
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_error_ledger_range"`);
		await queryRunner.query(`
			ALTER TABLE "history_archive_scan_error"
			DROP COLUMN "firstLedger",
			DROP COLUMN "lastLedger"
		`);
	}
}
