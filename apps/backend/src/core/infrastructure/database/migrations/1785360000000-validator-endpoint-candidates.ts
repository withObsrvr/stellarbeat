import { MigrationInterface, QueryRunner } from 'typeorm';

export class ValidatorEndpointCandidates1785360000000
	implements MigrationInterface
{
	name = 'ValidatorEndpointCandidates1785360000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
		await queryRunner.query(`
			CREATE TABLE "validator_endpoint_candidate" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"networkId" varchar(64) NOT NULL,
				"expectedPublicKey" varchar(56),
				"hostname" varchar(255),
				"ip" varchar(45),
				"port" integer NOT NULL,
				"source" varchar(40) NOT NULL,
				"sourceReference" varchar(512),
				"submitter" varchar(128),
				"reason" varchar(512),
				"firstSeenAt" timestamptz NOT NULL,
				"lastSeenAt" timestamptz NOT NULL,
				"lastResolvedAt" timestamptz,
				"dnsTtl" integer,
				"enabled" boolean NOT NULL DEFAULT true,
				"expiresAt" timestamptz,
				"state" varchar(20) NOT NULL,
				"lastAttemptedAt" timestamptz,
				"lastSuccessfulAuthenticationAt" timestamptz,
				"dedupeKey" varchar(512) NOT NULL,
				"createdAt" timestamptz NOT NULL DEFAULT now(),
				"updatedAt" timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT "PK_validator_endpoint_candidate" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_validator_endpoint_candidate_dedupe" UNIQUE ("dedupeKey"),
				CONSTRAINT "CHK_validator_endpoint_candidate_address" CHECK ("hostname" IS NOT NULL OR "ip" IS NOT NULL OR "expectedPublicKey" IS NOT NULL)
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "IDX_endpoint_candidate_network_enabled" ON "validator_endpoint_candidate" ("networkId", "enabled", "expiresAt")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_endpoint_candidate_network_key" ON "validator_endpoint_candidate" ("networkId", "expectedPublicKey")`
		);

		await queryRunner.query(`
			CREATE TABLE "endpoint_probe_observation" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"candidateId" uuid NOT NULL,
				"scanId" varchar(128),
				"vantagePoint" varchar(64) NOT NULL,
				"attemptedAt" timestamptz NOT NULL,
				"completedAt" timestamptz NOT NULL,
				"outcome" varchar(40) NOT NULL,
				"failureStage" varchar(32),
				"resolvedIp" varchar(45),
				"remotePublicKey" varchar(56),
				"coreVersion" varchar(128),
				"overlayMinVersion" integer,
				"overlayVersion" integer,
				"remoteNetworkId" varchar(128),
				"errorCode" varchar(80),
				"sanitizedDetail" varchar(240),
				CONSTRAINT "PK_endpoint_probe_observation" PRIMARY KEY ("id"),
				CONSTRAINT "FK_endpoint_probe_candidate" FOREIGN KEY ("candidateId") REFERENCES "validator_endpoint_candidate"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query(
			`CREATE INDEX "IDX_endpoint_probe_candidate_time" ON "endpoint_probe_observation" ("candidateId", "attemptedAt")`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_endpoint_probe_outcome_time" ON "endpoint_probe_observation" ("outcome", "attemptedAt")`
		);

		await queryRunner.query(`
			INSERT INTO "validator_endpoint_candidate" (
				"networkId", "expectedPublicKey", "ip", "port", "source",
				"firstSeenAt", "lastSeenAt", "state", "dedupeKey"
			)
			SELECT
				COALESCE((SELECT "networkIdValue" FROM "network" LIMIT 1), 'public'),
				n."publicKeyValue", s."ip", s."port", 'persisted_node',
				n."dateDiscovered", now(), 'unverified',
				COALESCE((SELECT "networkIdValue" FROM "network" LIMIT 1), 'public') || '|' || n."publicKeyValue" || '||' || s."ip" || '|' || s."port"
			FROM "node" n
			JOIN "node_snap_shot" s ON s."NodeId" = n."id"
			WHERE s."endDate" = (
				SELECT max(s2."endDate") FROM "node_snap_shot" s2 WHERE s2."NodeId" = n."id"
			)
			ON CONFLICT ("dedupeKey") DO NOTHING
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "endpoint_probe_observation"`);
		await queryRunner.query(`DROP TABLE "validator_endpoint_candidate"`);
	}
}
