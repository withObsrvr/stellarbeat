import { v4 as uuidv4 } from 'uuid';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index
} from 'typeorm';

@Entity({ name: 'history_archive_scan_job_queue' })
@Index('idx_scanjob_status', ['status'])
@Index('idx_scanjob_url', ['url'])
@Index('idx_scanjob_remote_id', ['remoteId'], { unique: true })
@Index('idx_scanjob_priority', ['priority'])
export class ScanJob {
	@PrimaryGeneratedColumn()
	public id!: number;

	@Column({ type: 'uuid', nullable: false })
	public readonly remoteId: string = uuidv4();

	@Column()
	public url: string;

	@Column({ default: 0 })
	public latestScannedLedger: number;

	@Column({ type: 'varchar', nullable: true })
	public latestScannedLedgerHeaderHash: string | null;

	@Column({ type: 'timestamp', nullable: true })
	public chainInitDate: Date | null;

	@Column({ type: 'varchar', default: 'PENDING' })
	public status: 'PENDING' | 'TAKEN' | 'DONE';

	@Column({ type: 'int', default: 0 })
	public priority: number;

	@CreateDateColumn()
	public createdAt?: Date;

	@UpdateDateColumn()
	public updatedAt?: Date;

	constructor(
		url: string,
		latestScannedLedger = 0,
		latestScannedLedgerHeaderHash: string | null = null,
		chainInitDate: Date | null = null,
		priority = 0
	) {
		this.url = url;
		this.latestScannedLedger = latestScannedLedger;
		this.latestScannedLedgerHeaderHash = latestScannedLedgerHeaderHash;
		this.chainInitDate = chainInitDate;
		this.status = 'PENDING';
		this.priority = priority;
	}

	static createPriorityJob(url: string, priority: number): ScanJob {
		return new ScanJob(url, 0, null, null, priority);
	}

	public isNewScanChainJob(): boolean {
		return this.chainInitDate === null;
	}
}
