import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrustCentralityMetrics1751570404901 implements MigrationInterface {
	name = 'TrustCentralityMetrics1751570404901';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add trust metric columns to node_snap_shot table
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ADD "trustCentralityScore" decimal(10,8) DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ADD "pageRankScore" decimal(10,8) DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ADD "trustRank" integer DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" ADD "lastTrustCalculation" timestamptz`
		);

		// Add trust metric columns to node_measurement_v2 table
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "trustCentralityScore" decimal(10,8) DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "pageRankScore" decimal(10,8) DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "trustRank" integer DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" ADD "lastTrustCalculation" timestamptz`
		);

		// Add indexes for performance on node_snap_shot
		await queryRunner.query(
			`CREATE INDEX "IDX_node_snap_shot_trust_centrality_score" ON "node_snap_shot" ("trustCentralityScore")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_node_snap_shot_page_rank_score" ON "node_snap_shot" ("pageRankScore")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_node_snap_shot_trust_rank" ON "node_snap_shot" ("trustRank")`
		);

		// Add indexes for performance on node_measurement_v2
		await queryRunner.query(
			`CREATE INDEX "IDX_node_measurement_v2_trust_centrality_score" ON "node_measurement_v2" ("trustCentralityScore")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_node_measurement_v2_page_rank_score" ON "node_measurement_v2" ("pageRankScore")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_node_measurement_v2_trust_rank" ON "node_measurement_v2" ("trustRank")`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop indexes from node_measurement_v2
		await queryRunner.query(
			`DROP INDEX "IDX_node_measurement_v2_trust_rank"`
		);
		await queryRunner.query(
			`DROP INDEX "IDX_node_measurement_v2_page_rank_score"`
		);
		await queryRunner.query(
			`DROP INDEX "IDX_node_measurement_v2_trust_centrality_score"`
		);

		// Drop indexes from node_snap_shot
		await queryRunner.query(
			`DROP INDEX "IDX_node_snap_shot_trust_rank"`
		);
		await queryRunner.query(
			`DROP INDEX "IDX_node_snap_shot_page_rank_score"`
		);
		await queryRunner.query(
			`DROP INDEX "IDX_node_snap_shot_trust_centrality_score"`
		);

		// Drop columns from node_measurement_v2
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "lastTrustCalculation"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "trustRank"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "pageRankScore"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_measurement_v2" DROP COLUMN "trustCentralityScore"`
		);

		// Drop columns from node_snap_shot
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN "lastTrustCalculation"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN "trustRank"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN "pageRankScore"`
		);
		await queryRunner.query(
			`ALTER TABLE "node_snap_shot" DROP COLUMN "trustCentralityScore"`
		);
	}
}