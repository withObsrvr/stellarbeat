import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrustCentralityMetrics1751570404901 implements MigrationInterface {
	name = 'TrustCentralityMetrics1751570404901';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// First check if columns exist, if not add them without indexes
		const nodeSnapShotColumns = await queryRunner.query(
			`SELECT column_name FROM information_schema.columns 
			WHERE table_schema = 'public' 
			AND table_name = 'node_snap_shot' 
			AND column_name IN ('trustCentralityScore', 'pageRankScore', 'trustRank', 'lastTrustCalculation')`
		);
		
		const existingColumns = nodeSnapShotColumns.map((row: any) => row.column_name);
		
		// Add missing columns to node_snap_shot
		if (!existingColumns.includes('trustCentralityScore')) {
			await queryRunner.query(
				`ALTER TABLE "node_snap_shot" ADD "trustCentralityScore" decimal(12,8) DEFAULT 0`
			);
		}
		if (!existingColumns.includes('pageRankScore')) {
			await queryRunner.query(
				`ALTER TABLE "node_snap_shot" ADD "pageRankScore" decimal(12,8) DEFAULT 0`
			);
		}
		if (!existingColumns.includes('trustRank')) {
			await queryRunner.query(
				`ALTER TABLE "node_snap_shot" ADD "trustRank" integer DEFAULT 0`
			);
		}
		if (!existingColumns.includes('lastTrustCalculation')) {
			await queryRunner.query(
				`ALTER TABLE "node_snap_shot" ADD "lastTrustCalculation" timestamptz`
			);
		}

		// Check columns for node_measurement_v2
		const nodeMeasurementColumns = await queryRunner.query(
			`SELECT column_name FROM information_schema.columns 
			WHERE table_schema = 'public' 
			AND table_name = 'node_measurement_v2' 
			AND column_name IN ('trustCentralityScore', 'pageRankScore', 'trustRank', 'lastTrustCalculation')`
		);
		
		const existingMeasurementColumns = nodeMeasurementColumns.map((row: any) => row.column_name);
		
		// Add missing columns to node_measurement_v2
		if (!existingMeasurementColumns.includes('trustCentralityScore')) {
			await queryRunner.query(
				`ALTER TABLE "node_measurement_v2" ADD "trustCentralityScore" decimal(12,8) DEFAULT 0`
			);
		}
		if (!existingMeasurementColumns.includes('pageRankScore')) {
			await queryRunner.query(
				`ALTER TABLE "node_measurement_v2" ADD "pageRankScore" decimal(12,8) DEFAULT 0`
			);
		}
		if (!existingMeasurementColumns.includes('trustRank')) {
			await queryRunner.query(
				`ALTER TABLE "node_measurement_v2" ADD "trustRank" integer DEFAULT 0`
			);
		}
		if (!existingMeasurementColumns.includes('lastTrustCalculation')) {
			await queryRunner.query(
				`ALTER TABLE "node_measurement_v2" ADD "lastTrustCalculation" timestamptz`
			);
		}

		// Create indexes CONCURRENTLY (non-blocking)
		// Note: CONCURRENTLY cannot be used inside a transaction, so we defer index creation
		console.log('\n🔥 IMPORTANT: Trust metric columns have been added successfully!');
		console.log('📋 Next step: Create indexes manually to avoid blocking operations');
		console.log('📁 Script location: scripts/create-trust-indexes-concurrent.sql');
		console.log('⚡ Run this script manually when the system is stable');
		console.log('📊 Monitor progress with: SELECT * FROM pg_stat_progress_create_index;\n');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop indexes if they exist
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_measurement_v2_trust_rank"`
		);
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_measurement_v2_page_rank_score"`
		);
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_measurement_v2_trust_centrality_score"`
		);
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_snap_shot_trust_rank"`
		);
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_snap_shot_page_rank_score"`
		);
		await queryRunner.query(
			`DROP INDEX IF EXISTS "IDX_node_snap_shot_trust_centrality_score"`
		);

		// Drop columns
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "lastTrustCalculation"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "trustRank"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "pageRankScore"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN IF EXISTS "trustCentralityScore"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "lastTrustCalculation"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "trustRank"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "pageRankScore"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN IF EXISTS "trustCentralityScore"`
		);
	}
}