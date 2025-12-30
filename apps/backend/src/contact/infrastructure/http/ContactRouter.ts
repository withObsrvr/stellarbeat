import * as express from 'express';
import { body, validationResult } from 'express-validator';
import { SendContactSubmission } from '../../use-cases/send-contact-submission/SendContactSubmission';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import { Throttler } from '../../../core/infrastructure/http/Throttler';
import { Router } from 'express';

const contactThrottler = new Throttler(5, 1000 * 60);

export interface ContactRouterConfig {
	sendContactSubmission: SendContactSubmission;
	exceptionLogger: ExceptionLogger;
}

const contactRouterWrapper = (config: ContactRouterConfig): Router => {
	const contactRouter = express.Router();

	// Submit contact form
	contactRouter.post(
		'/',
		[
			body('name')
				.trim()
				.notEmpty()
				.withMessage('Name is required')
				.isLength({ max: 100 })
				.withMessage('Name must be at most 100 characters'),
			body('emailAddress')
				.trim()
				.isEmail()
				.normalizeEmail()
				.withMessage('Valid email is required'),
			body('company')
				.optional()
				.trim()
				.isLength({ max: 200 })
				.withMessage('Company must be at most 200 characters'),
			body('serviceInterest')
				.trim()
				.notEmpty()
				.withMessage('Service interest is required')
				.isLength({ max: 200 })
				.withMessage('Service interest must be at most 200 characters'),
			body('message')
				.trim()
				.notEmpty()
				.withMessage('Message is required')
				.isLength({ max: 5000 })
				.withMessage('Message must be at most 5000 characters')
		],
		async function (req: express.Request, res: express.Response) {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			if (req.ip) {
				contactThrottler.processRequest(req.ip, new Date());
				if (contactThrottler.throttled(req.ip))
					return res.status(429).json({ error: 'Too many requests' });
			}

			const result = await config.sendContactSubmission.execute({
				name: req.body.name,
				emailAddress: req.body.emailAddress,
				company: req.body.company,
				serviceInterest: req.body.serviceInterest,
				message: req.body.message,
				timestamp: new Date()
			});

			if (result.isOk()) {
				return res.status(200).json({ message: 'Success' });
			} else {
				config.exceptionLogger.captureException(result.error);
				return res.status(500).json({ error: 'Something went wrong' });
			}
		}
	);

	return contactRouter;
};

export { contactRouterWrapper as contactRouter };
