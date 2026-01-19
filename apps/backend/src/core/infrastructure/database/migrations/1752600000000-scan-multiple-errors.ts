import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScanMultipleErrors1752600000000 implements MigrationInterface {
	name = 'ScanMultipleErrors1752600000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 0. Create the category enum type
		await queryRunner.query(`
			CREATE TYPE "public"."history_archive_scan_error_category_enum" AS ENUM (
				'TRANSACTION_SET_HASH',
				'TRANSACTION_RESULT_HASH',
				'LEDGER_HEADER_HASH',
				'BUCKET_HASH',
				'MISSING_FILE',
				'CONNECTION',
				'OTHER'
			)
		`);

		// 1. Add scanId column to error table (nullable initially for migration)
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" ADD "scanId" integer`
		);

		// 1.5 Add count and category columns
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" ADD "count" integer NOT NULL DEFAULT 1`
		);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" ADD "category" "public"."history_archive_scan_error_category_enum" NOT NULL DEFAULT 'OTHER'`
		);

		// 2. Migrate existing data: set scanId based on the reverse relationship
		await queryRunner.query(`
			UPDATE "history_archive_scan_error" e
			SET "scanId" = s.id
			FROM "history_archive_scan_v2" s
			WHERE s."errorId" = e.id
		`);

		// 3. Drop the old foreign key from scan to error
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" DROP CONSTRAINT "FK_46eec21600c888d33ee311b9fc7"`
		);

		// 4. Drop the unique constraint on errorId
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" DROP CONSTRAINT "UQ_46eec21600c888d33ee311b9fc7"`
		);

		// 5. Drop the errorId column from scan table
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" DROP COLUMN "errorId"`
		);

		// 6. Create foreign key from error to scan
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" ADD CONSTRAINT "FK_error_scan" FOREIGN KEY ("scanId") REFERENCES "history_archive_scan_v2"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
		);

		// 7. Create index on scanId for performance
		await queryRunner.query(
			`CREATE INDEX "IDX_error_scan" ON "history_archive_scan_error" ("scanId")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// 1. Drop the index
		await queryRunner.query(`DROP INDEX "public"."IDX_error_scan"`);

		// 2. Drop the foreign key from error to scan
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" DROP CONSTRAINT "FK_error_scan"`
		);

		// 3. Add errorId column back to scan table
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" ADD "errorId" integer`
		);

		// 4. Migrate data back: pick first error for each scan
		await queryRunner.query(`
			UPDATE "history_archive_scan_v2" s
			SET "errorId" = (
				SELECT e.id FROM "history_archive_scan_error" e
				WHERE e."scanId" = s.id
				LIMIT 1
			)
		`);

		// 5. Add unique constraint back
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" ADD CONSTRAINT "UQ_46eec21600c888d33ee311b9fc7" UNIQUE ("errorId")`
		);

		// 6. Add foreign key back from scan to error
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_v2" ADD CONSTRAINT "FK_46eec21600c888d33ee311b9fc7" FOREIGN KEY ("errorId") REFERENCES "history_archive_scan_error"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
		);

		// 7. Drop scanId column from error table
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" DROP COLUMN "scanId"`
		);

		// 8. Drop count and category columns
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" DROP COLUMN "count"`
		);
		await queryRunner.query(
			`ALTER TABLE "history_archive_scan_error" DROP COLUMN "category"`
		);

		// 9. Drop the category enum type
		await queryRunner.query(
			`DROP TYPE "public"."history_archive_scan_error_category_enum"`
		);
	}
}
