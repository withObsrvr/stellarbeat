import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeededTrustMetrics1752521626000 implements MigrationInterface {
	name = 'SeededTrustMetrics1752521626000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add seeded trust metrics columns to node_measurement table
		await queryRunner.query(`
			ALTER TABLE "node_measurement" 
			ADD COLUMN "seeded_trust_centrality_score" DECIMAL(5,2) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement" 
			ADD COLUMN "seeded_page_rank_score" DECIMAL(10,8) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement" 
			ADD COLUMN "seeded_trust_rank" INTEGER DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement" 
			ADD COLUMN "seed_organization" VARCHAR(255) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement" 
			ADD COLUMN "distance_from_seeds" INTEGER DEFAULT NULL
		`);

		// Create indexes for better query performance
		await queryRunner.query(`
			CREATE INDEX "idx_node_measurement_seeded_trust_rank" 
			ON "node_measurement" ("seeded_trust_rank")
		`);

		await queryRunner.query(`
			CREATE INDEX "idx_node_measurement_seed_organization" 
			ON "node_measurement" ("seed_organization")
		`);

		await queryRunner.query(`
			CREATE INDEX "idx_node_measurement_distance_from_seeds" 
			ON "node_measurement" ("distance_from_seeds")
		`);

		// Composite index for organization + rank queries
		await queryRunner.query(`
			CREATE INDEX "idx_node_measurement_org_seeded_rank" 
			ON "node_measurement" ("seed_organization", "seeded_trust_rank")
		`);

		// Composite index for time + organization queries
		await queryRunner.query(`
			CREATE INDEX "idx_node_measurement_time_org_seeded" 
			ON "node_measurement" ("time", "seed_organization")
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop indexes first
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_time_org_seeded"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_org_seeded_rank"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_distance_from_seeds"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_seed_organization"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_seeded_trust_rank"`);

		// Drop columns
		await queryRunner.query(`ALTER TABLE "node_measurement" DROP COLUMN "distance_from_seeds"`);
		await queryRunner.query(`ALTER TABLE "node_measurement" DROP COLUMN "seed_organization"`);
		await queryRunner.query(`ALTER TABLE "node_measurement" DROP COLUMN "seeded_trust_rank"`);
		await queryRunner.query(`ALTER TABLE "node_measurement" DROP COLUMN "seeded_page_rank_score"`);
		await queryRunner.query(`ALTER TABLE "node_measurement" DROP COLUMN "seeded_trust_centrality_score"`);
	}
}