import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTrustMetricsPrecision1751577500000 implements MigrationInterface {
	name = 'FixTrustMetricsPrecision1751577500000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Update node_snap_shot table - change from decimal(10,8) to decimal(12,8) to allow values up to 9999.99999999
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ALTER COLUMN "trustCentralityScore" TYPE decimal(12,8)`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ALTER COLUMN "pageRankScore" TYPE decimal(12,8)`
		);

		// Update node_measurement_v2 table - change from decimal(10,8) to decimal(12,8)
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ALTER COLUMN "trustCentralityScore" TYPE decimal(12,8)`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ALTER COLUMN "pageRankScore" TYPE decimal(12,8)`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Revert back to original precision - note this may cause data loss if values exceed the smaller precision
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ALTER COLUMN "pageRankScore" TYPE decimal(10,8)`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ALTER COLUMN "trustCentralityScore" TYPE decimal(10,8)`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ALTER COLUMN "pageRankScore" TYPE decimal(10,8)`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ALTER COLUMN "trustCentralityScore" TYPE decimal(10,8)`
		);
	}
}