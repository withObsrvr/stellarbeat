import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';
import { ConnectionAttempt } from 'crawler';
import ValidatorEndpointCandidate from './ValidatorEndpointCandidate';

@Entity('endpoint_probe_observation')
@Index(['candidateId', 'attemptedAt'])
@Index(['outcome', 'attemptedAt'])
export default class EndpointProbeObservation {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'uuid' })
	candidateId!: string;

	@ManyToOne(
		() => ValidatorEndpointCandidate,
		(candidate) => candidate.observations,
		{
			onDelete: 'CASCADE'
		}
	)
	@JoinColumn({ name: 'candidateId' })
	candidate?: ValidatorEndpointCandidate;

	@Column({ type: 'varchar', length: 128, nullable: true })
	scanId!: string | null;

	@Column({ type: 'varchar', length: 64 })
	vantagePoint!: string;

	@Column({ type: 'timestamptz' })
	attemptedAt!: Date;

	@Column({ type: 'timestamptz' })
	completedAt!: Date;

	@Column({ type: 'varchar', length: 40 })
	outcome!: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	failureStage!: string | null;

	@Column({ type: 'varchar', length: 45, nullable: true })
	resolvedIp!: string | null;

	@Column({ type: 'varchar', length: 56, nullable: true })
	remotePublicKey!: string | null;

	@Column({ type: 'varchar', length: 128, nullable: true })
	coreVersion!: string | null;

	@Column({ type: 'integer', nullable: true })
	overlayMinVersion!: number | null;

	@Column({ type: 'integer', nullable: true })
	overlayVersion!: number | null;

	@Column({ type: 'varchar', length: 128, nullable: true })
	remoteNetworkId!: string | null;

	@Column({ type: 'varchar', length: 80, nullable: true })
	errorCode!: string | null;

	@Column({ type: 'varchar', length: 240, nullable: true })
	sanitizedDetail!: string | null;

	static fromConnectionAttempt(
		candidateId: string,
		attempt: ConnectionAttempt,
		options: {
			scanId?: string | null;
			vantagePoint?: string;
			outcome?: string;
		} = {}
	): EndpointProbeObservation {
		const observation = new EndpointProbeObservation();
		observation.candidateId = candidateId;
		observation.scanId = options.scanId ?? null;
		observation.vantagePoint = options.vantagePoint ?? 'radar-local';
		observation.attemptedAt = attempt.attemptedAt;
		observation.completedAt = attempt.completedAt;
		observation.outcome = options.outcome ?? attempt.outcome;
		observation.failureStage = attempt.failureStage ?? null;
		observation.resolvedIp = attempt.ip ?? null;
		observation.remotePublicKey = attempt.remotePublicKey ?? null;
		observation.coreVersion = attempt.nodeInfo?.versionString ?? null;
		observation.overlayMinVersion = attempt.nodeInfo?.overlayMinVersion ?? null;
		observation.overlayVersion = attempt.nodeInfo?.overlayVersion ?? null;
		observation.remoteNetworkId = attempt.nodeInfo?.networkId ?? null;
		observation.errorCode = attempt.errorCode ?? null;
		observation.sanitizedDetail = attempt.sanitizedDetail ?? null;
		return observation;
	}
}
