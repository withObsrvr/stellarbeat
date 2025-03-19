import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConnectableNodes1742387934545 implements MigrationInterface {
	name = 'ConnectableNodes1742387934545';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "network_measurement" ADD "nrOfConnectableNodes" smallint NOT NULL DEFAULT '0'`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement_month" ADD "nrOfConnectableNodesSum" integer NOT NULL DEFAULT '0'`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement_day" ADD "nrOfConnectableNodesSum" integer NOT NULL DEFAULT '0'`
		);
		await queryRunner.query(
			`UPDATE network_measurement SET "nrOfConnectableNodes" = "nrOfActiveWatchers" + "nrOfActiveValidators"`
		);
		await queryRunner.query(
			`UPDATE network_measurement_month SET "nrOfConnectableNodesSum" = "nrOfActiveWatchersSum" + "nrOfActiveValidatorsSum"`
		);
		await queryRunner.query(
			`UPDATE network_measurement_day SET "nrOfConnectableNodesSum" = "nrOfActiveWatchersSum" + "nrOfActiveValidatorsSum"`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "network_measurement_day" DROP COLUMN "nrOfConnectableNodesSum"`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement_month" DROP COLUMN "nrOfConnectableNodesSum"`
		);
		await queryRunner.query(
			`ALTER TABLE "network_measurement" DROP COLUMN "nrOfConnectableNodes"`
		);
	}
}
