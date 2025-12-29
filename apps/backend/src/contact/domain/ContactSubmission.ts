export interface ContactSubmission {
	name: string;
	emailAddress: string;
	company?: string;
	serviceInterest: string;
	message: string;
	timestamp: Date;
}
