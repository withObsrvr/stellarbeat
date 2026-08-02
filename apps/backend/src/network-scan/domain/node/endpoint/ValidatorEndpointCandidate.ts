import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import EndpointProbeObservation from './EndpointProbeObservation';

export type EndpointCandidateSource =
	| 'persisted_node'
	| 'configured_seed'
	| 'operator_submission'
	| 'toml_declaration'
	| 'peer_gossip'
	| 'external_peer_observation'
	| 'dns_resolution';

export type EndpointCandidateState =
	| 'unverified'
	| 'authenticated'
	| 'failed'
	| 'stale'
	| 'quarantined'
	| 'disabled';

export interface ValidatorEndpointCandidateProps {
	networkId: string;
	expectedPublicKey?: string | null;
	hostname?: string | null;
	ip?: string | null;
	port: number;
	source: EndpointCandidateSource;
	sourceReference?: string | null;
	submitter?: string | null;
	reason?: string | null;
	expiresAt?: Date | null;
}

@Entity('validator_endpoint_candidate')
@Index(['networkId', 'enabled', 'expiresAt'])
@Index(['networkId', 'expectedPublicKey'])
export default class ValidatorEndpointCandidate {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ type: 'varchar', length: 64 })
	networkId!: string;

	@Column({ type: 'varchar', length: 56, nullable: true })
	expectedPublicKey!: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	hostname!: string | null;

	@Column({ type: 'varchar', length: 45, nullable: true })
	ip!: string | null;

	@Column({ type: 'integer' })
	port!: number;

	@Column({ type: 'varchar', length: 40 })
	source!: EndpointCandidateSource;

	@Column({ type: 'varchar', length: 512, nullable: true })
	sourceReference!: string | null;

	@Column({ type: 'varchar', length: 128, nullable: true })
	submitter!: string | null;

	@Column({ type: 'varchar', length: 512, nullable: true })
	reason!: string | null;

	@Column({ type: 'timestamptz' })
	firstSeenAt!: Date;

	@Column({ type: 'timestamptz' })
	lastSeenAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	lastResolvedAt!: Date | null;

	@Column({ type: 'integer', nullable: true })
	dnsTtl!: number | null;

	@Column({ type: 'boolean', default: true })
	enabled!: boolean;

	@Column({ type: 'timestamptz', nullable: true })
	expiresAt!: Date | null;

	@Column({ type: 'varchar', length: 20 })
	state!: EndpointCandidateState;

	@Column({ type: 'timestamptz', nullable: true })
	lastAttemptedAt!: Date | null;

	@Column({ type: 'timestamptz', nullable: true })
	lastSuccessfulAuthenticationAt!: Date | null;

	@Column({ type: 'varchar', length: 512, unique: true })
	dedupeKey!: string;

	@OneToMany(
		() => EndpointProbeObservation,
		(observation) => observation.candidate
	)
	observations?: EndpointProbeObservation[];

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date;

	static create(
		props: ValidatorEndpointCandidateProps,
		time = new Date()
	): ValidatorEndpointCandidate {
		const candidate = new ValidatorEndpointCandidate();
		candidate.networkId = props.networkId;
		candidate.expectedPublicKey = props.expectedPublicKey ?? null;
		candidate.hostname = props.hostname?.toLowerCase() ?? null;
		candidate.ip = props.ip ?? null;
		candidate.port = props.port;
		candidate.source = props.source;
		candidate.sourceReference = props.sourceReference ?? null;
		candidate.submitter = props.submitter ?? null;
		candidate.reason = props.reason ?? null;
		candidate.firstSeenAt = time;
		candidate.lastSeenAt = time;
		candidate.lastResolvedAt = null;
		candidate.dnsTtl = null;
		candidate.enabled = true;
		candidate.expiresAt = props.expiresAt ?? null;
		candidate.state = 'unverified';
		candidate.lastAttemptedAt = null;
		candidate.lastSuccessfulAuthenticationAt = null;
		candidate.dedupeKey = ValidatorEndpointCandidate.buildDedupeKey(props);
		return candidate;
	}

	static buildDedupeKey(props: ValidatorEndpointCandidateProps): string {
		return [
			props.networkId,
			props.expectedPublicKey ?? '',
			props.hostname?.toLowerCase() ?? '',
			props.ip ?? '',
			props.port
		].join('|');
	}

	seen(time = new Date()): void {
		this.lastSeenAt = time;
	}

	resolved(time: Date, ttl: number | null): void {
		this.lastResolvedAt = time;
		this.dnsTtl = ttl;
		this.lastSeenAt = time;
	}

	authenticated(remotePublicKey: string, time: Date): void {
		this.expectedPublicKey ??= remotePublicKey;
		this.state = 'authenticated';
		this.lastAttemptedAt = time;
		this.lastSuccessfulAuthenticationAt = time;
	}

	failed(time: Date): void {
		if (this.lastSuccessfulAuthenticationAt === null) this.state = 'failed';
		this.lastAttemptedAt = time;
	}

	quarantine(time: Date): void {
		this.state = 'quarantined';
		this.lastAttemptedAt = time;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.state = enabled ? 'unverified' : 'disabled';
	}

	isEligible(at = new Date()): boolean {
		return this.enabled && (this.expiresAt === null || this.expiresAt > at);
	}
}
