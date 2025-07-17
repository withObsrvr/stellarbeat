import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeededTrustMetrics1752521626000 implements MigrationInterface {
	name = 'SeededTrustMetrics1752521626000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add seeded trust metrics columns to node_measurement_v2 table
		await queryRunner.query(`
			ALTER TABLE "node_measurement_v2" 
			ADD COLUMN "seeded_trust_centrality_score" DECIMAL(5,2) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement_v2" 
			ADD COLUMN "seeded_page_rank_score" DECIMAL(10,8) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement_v2" 
			ADD COLUMN "seeded_trust_rank" INTEGER DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement_v2" 
			ADD COLUMN "seed_organization" VARCHAR(255) DEFAULT NULL
		`);

		await queryRunner.query(`
			ALTER TABLE "node_measurement_v2" 
			ADD COLUMN "distance_from_seeds" INTEGER DEFAULT NULL
		`);

		// Defer index creation to avoid blocking - create manually with CONCURRENTLY
		console.log('\n📊 SEEDED TRUST: Columns added successfully!');
		console.log('📋 Next step: Create seeded trust indexes manually');
		console.log('💡 Run these commands manually when system is stable:');
		console.log('CREATE INDEX CONCURRENTLY "idx_node_measurement_v2_seeded_trust_rank" ON "node_measurement_v2" ("seeded_trust_rank");');
		console.log('CREATE INDEX CONCURRENTLY "idx_node_measurement_v2_seed_organization" ON "node_measurement_v2" ("seed_organization");');
		console.log('CREATE INDEX CONCURRENTLY "idx_node_measurement_v2_distance_from_seeds" ON "node_measurement_v2" ("distance_from_seeds");');
		console.log('CREATE INDEX CONCURRENTLY "idx_node_measurement_v2_org_seeded_rank" ON "node_measurement_v2" ("seed_organization", "seeded_trust_rank");');
		console.log('CREATE INDEX CONCURRENTLY "idx_node_measurement_v2_time_org_seeded" ON "node_measurement_v2" ("time", "seed_organization");\n');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop indexes first
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_v2_time_org_seeded"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_v2_org_seeded_rank"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_v2_distance_from_seeds"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_v2_seed_organization"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_measurement_v2_seeded_trust_rank"`);

		// Drop columns
		await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN "distance_from_seeds"`);
		await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN "seed_organization"`);
		await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN "seeded_trust_rank"`);
		await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN "seeded_page_rank_score"`);
		await queryRunner.query(`ALTER TABLE "node_measurement_v2" DROP COLUMN "seeded_trust_centrality_score"`);
	}
}