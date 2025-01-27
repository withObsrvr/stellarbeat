import express, { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import basicAuth from 'express-basic-auth';
import { GetLatestScan } from '../../use-cases/get-latest-scan/GetLatestScan';
import { InvalidUrlError } from '../../use-cases/get-latest-scan/InvalidUrlError';
import { RegisterScan } from '../../use-cases/register-scan/RegisterScan';
import { ScanDTO } from '../../use-cases/register-scan/ScanDTO';
import { GetScanJobs } from '../../use-cases/get-scan-jobs/GetScanJobs';

export interface HistoryScanRouterConfig {
	getLatestScan: GetLatestScan;
	getScanJobs: GetScanJobs;
	registerScan: RegisterScan;
	secret?: string;
}

export const HistoryScanRouterWrapper = (
	config: HistoryScanRouterConfig
): Router => {
	const historyScanRouter = express.Router();

	if (!config.secret) return historyScanRouter;

	historyScanRouter.post(
		'/',
		basicAuth({
			users: { admin: config.secret },
			challenge: true
		}),
		[
			body('startDate').isISO8601().withMessage('Invalid startDate').toDate(),
			body('endDate').isISO8601().withMessage('Invalid endDate').toDate(),
			body('scanChainInitDate')
				.isISO8601()
				.withMessage('Invalid scanChainInitDate')
				.toDate(),
			body('baseUrl').isURL().withMessage('Invalid baseUrl'),
			body('latestVerifiedLedger')
				.isInt({ min: 0 })
				.withMessage('latestVerifiedLedger must be a positive integer'),
			body('latestScannedLedger')
				.isInt({ min: 0 })
				.withMessage('latestScannedLedger must be a positive integer'),
			body('latestScannedLedgerHeaderHash').custom((value) => {
				if (value === null) return true;
				return typeof value === 'string';
			}),
			body('concurrency')
				.isInt({ min: 0 })
				.withMessage('concurrency must be a positive integer'),
			body('isSlowArchive')
				.optional()
				.custom((value) => {
					if (value === null) return true;
					return typeof value === 'boolean';
				})
				.withMessage('isSlowArchive must be null or a boolean'),
			body('fromLedger')
				.isInt({ min: 0 })
				.withMessage('fromLedger must be a positive integer'),
			body('toLedger')
				.custom((value) => {
					if (value === null) return true;
					if (Number.isInteger(value) && value >= 0) return true;
					return false;
				})
				.withMessage('toLedger must be null or a positive integer'),
			body('error').custom((value) => {
				if (value === null) return true;
				return typeof value === 'object';
			})
		],
		async (req: express.Request, res: express.Response) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				console.log(errors);
				return res.status(400).json({ errors: errors.array() });
			}

			const dto: ScanDTO = {
				startDate: req.body.startDate,
				endDate: req.body.endDate,
				scanChainInitDate: req.body.scanChainInitDate ?? null,
				baseUrl: req.body.baseUrl,
				latestVerifiedLedger: req.body.latestVerifiedLedger,
				latestScannedLedger: req.body.latestScannedLedger,
				latestScannedLedgerHeaderHash:
					req.body.latestScannedLedgerHeaderHash ?? null,
				concurrency: req.body.concurrency,
				isSlowArchive:
					req.body.isSlowArchive !== undefined ? req.body.isSlowArchive : null,
				fromLedger: req.body.fromLedger,
				toLedger: req.body.toLedger ?? null,
				error: req.body.error
			};

			const result = await config.registerScan.execute(dto);

			if (result.isErr()) {
				return res.status(500).json({ error: result.error.message });
			}

			return res.status(201).json({ message: 'Scan created successfully' });
		}
	);

	historyScanRouter.get(
		'/jobs',
		basicAuth({
			users: { admin: config.secret || '' },
			challenge: true
		}),
		async (req: express.Request, res: express.Response) => {
			const scanJobsResult = await config.getScanJobs.execute();

			if (scanJobsResult.isErr()) {
				return res.status(500).json({ error: scanJobsResult.error.message });
			}

			return res.json(scanJobsResult.value);
		}
	);

	historyScanRouter.get(
		'/:url',
		[param('url').isURL()],
		async function (req: express.Request, res: express.Response) {
			res.setHeader('Cache-Control', 'public, max-age=' + 60);
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const scanOrError = await config.getLatestScan.execute({
				url: req.params.url
			});

			if (scanOrError.isErr() && scanOrError.error instanceof InvalidUrlError)
				return res.status(400).json({ error: 'Invalid url' });
			if (scanOrError.isErr())
				return res.status(500).json({ error: 'Internal server error' });

			if (scanOrError.value === null)
				return res.status(204).json({ message: 'No scan found for url' });

			return res.status(200).json(scanOrError.value);
		}
	);

	return historyScanRouter;
};

export { HistoryScanRouterWrapper as historyScanRouter };
