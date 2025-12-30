import { interfaces } from 'inversify';
import Container = interfaces.Container;
import { IUserService } from '../../../core/domain/IUserService';
import { UserService } from '../../../core/services/UserService';
import { SendContactSubmission } from '../../use-cases/send-contact-submission/SendContactSubmission';
import { Config } from '../../../core/config/Config';

export function load(container: Container, config: Config) {
	// Bind UserService (reuse from notifications if already bound, otherwise create)
	if (!container.isBound('UserService')) {
		container.bind<IUserService>('UserService').toDynamicValue(() => {
			if (!config.userServiceBaseUrl) {
				throw new Error('USER_SERVICE_BASE_URL not defined');
			}
			if (!config.userServiceUsername) {
				throw new Error('USER_SERVICE_USERNAME not defined');
			}
			if (!config.userServicePassword) {
				throw new Error('USER_SERVICE_PASSWORD not defined');
			}
			return new UserService(
				config.userServiceBaseUrl,
				config.userServiceUsername,
				config.userServicePassword,
				container.get('HttpService')
			);
		});
	}

	// Bind SendContactSubmission use case
	container.bind(SendContactSubmission).toDynamicValue(() => {
		if (!config.contactRecipientEmail) {
			throw new Error('CONTACT_RECIPIENT_EMAIL not defined');
		}
		return new SendContactSubmission(
			container.get<IUserService>('UserService'),
			config.contactRecipientEmail
		);
	});
}
