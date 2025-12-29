import { err, ok, Result } from 'neverthrow';
import { inject, injectable } from 'inversify';
import { IUserService } from '../../../core/domain/IUserService';
import { Message } from '../../../core/domain/Message';
import { ContactSubmission } from '../../domain/ContactSubmission';
import * as ejs from 'ejs';
import { mapUnknownToError } from '../../../core/utilities/mapUnknownToError';

export class SendContactSubmissionError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);
		this.name = 'SendContactSubmissionError';
		this.cause = cause;
	}
}

@injectable()
export class SendContactSubmission {
	constructor(
		@inject('UserService') protected userService: IUserService,
		protected recipientEmail: string
	) {}

	async execute(
		contactSubmission: ContactSubmission
	): Promise<Result<void, Error>> {
		try {
			// Render email template
			const body = await ejs.renderFile(
				__dirname + '/../../infrastructure/templates/contact-submission.ejs',
				{
					name: contactSubmission.name,
					emailAddress: contactSubmission.emailAddress,
					company: contactSubmission.company,
					serviceInterest: contactSubmission.serviceInterest,
					message: contactSubmission.message,
					timestamp: contactSubmission.timestamp
				}
			);

			const message = new Message(
				body,
				`New Contact Form Submission - ${contactSubmission.serviceInterest}`
			);

			// Find or create user for recipient email
			const userIdResult =
				await this.userService.findOrCreateUser(this.recipientEmail);
			if (userIdResult.isErr())
				return err(
					new SendContactSubmissionError(
						'Failed to find or create recipient user',
						userIdResult.error
					)
				);

			// Send message
			const sendResult = await this.userService.send(
				userIdResult.value,
				message
			);
			if (sendResult.isErr())
				return err(
					new SendContactSubmissionError(
						'Failed to send contact submission email',
						sendResult.error
					)
				);

			return ok(undefined);
		} catch (e) {
			return err(
				new SendContactSubmissionError(
					'Error processing contact submission',
					mapUnknownToError(e)
				)
			);
		}
	}
}
