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

export class ScanError implements Error {
	public readonly name = 'ScanError';
	public readonly type: ScanErrorType;
	public readonly url: string;
	public readonly message: string;
	public readonly count: number;
	public readonly category: ScanErrorCategory;

	constructor(
		type: ScanErrorType,
		url: string,
		message: string,
		count: number = 1,
		category: ScanErrorCategory = ScanErrorCategory.OTHER
	) {
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
