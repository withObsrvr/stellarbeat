import { IdentifiedValueObject } from '../../../core/domain/IdentifiedValueObject';
import { Column, Entity, ManyToOne } from 'typeorm';
import type { Scan } from './Scan';

export enum ScanErrorType {
	TYPE_VERIFICATION,
	TYPE_CONNECTION
}

export enum ScanErrorCategory {
	TRANSACTION_SET_HASH = 'TRANSACTION_SET_HASH',
	TRANSACTION_RESULT_HASH = 'TRANSACTION_RESULT_HASH',
	LEDGER_HEADER_HASH = 'LEDGER_HEADER_HASH',
	BUCKET_HASH = 'BUCKET_HASH',
	MISSING_FILE = 'MISSING_FILE',
	CONNECTION = 'CONNECTION',
	OTHER = 'OTHER'
}

@Entity({ name: 'history_archive_scan_error' })
export class ScanError extends IdentifiedValueObject implements Error {
	public readonly name = 'ScanError';

	@Column('enum', { enum: ScanErrorType, nullable: false })
	public readonly type: ScanErrorType;
	@Column('text', { nullable: false })
	public readonly url: string;
	@Column('text', { nullable: false })
	public readonly message: string;
	@Column('integer', { nullable: false, default: 1 })
	public readonly count: number;
	@Column('enum', { enum: ScanErrorCategory, nullable: false, default: ScanErrorCategory.OTHER })
	public readonly category: ScanErrorCategory;

	@ManyToOne('Scan', 'errors')
	public scan?: Scan;

	constructor(
		type: ScanErrorType,
		url: string,
		message: string,
		count: number = 1,
		category: ScanErrorCategory = ScanErrorCategory.OTHER
	) {
		super();
		this.type = type;
		this.url = url;
		this.message = message;
		this.count = count;
		this.category = category;
	}

	equals(other: this): boolean {
		return (
			this.type === other.type &&
			this.url === other.url &&
			this.message === other.message &&
			this.category === other.category
		);
	}
}
