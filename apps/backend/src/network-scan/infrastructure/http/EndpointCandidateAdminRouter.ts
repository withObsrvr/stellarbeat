import express, { Router } from 'express';
import basicAuth from 'express-basic-auth';
import { EndpointCandidateAdminService } from '../../domain/node/endpoint/EndpointCandidateAdminService';
import { ScanNetwork } from '../../use-cases/scan-network/ScanNetwork';

export interface EndpointCandidateAdminRouterConfig {
	service: EndpointCandidateAdminService;
	scanNetwork: ScanNetwork;
	networkId: string;
	username: string;
	password: string;
}

interface AuthenticatedRequest extends express.Request {
	auth?: { user: string };
}

export const endpointCandidateAdminRouter = (
	config: EndpointCandidateAdminRouterConfig
): Router => {
	const router = express.Router();
	router.use(
		basicAuth({
			users: { [config.username]: config.password },
			challenge: true
		})
	);

	router.get(
		'/networks/:networkId/endpoint-candidates',
		async (req: express.Request, res: express.Response) => {
			if (req.params.networkId !== config.networkId)
				return res.status(404).json({ error: 'Network not found' });
			return res.json(await config.service.list());
		}
	);

	router.post(
		'/networks/:networkId/endpoint-candidates',
		async (req: AuthenticatedRequest, res: express.Response) => {
			if (req.params.networkId !== config.networkId)
				return res.status(404).json({ error: 'Network not found' });
			try {
				const expiresAt = parseOptionalDate(req.body.expiresAt);
				const candidates = await config.service.submit({
					expectedPublicKey: req.body.expectedPublicKey,
					hostname: req.body.hostname,
					ip: req.body.ip,
					port: req.body.port,
					homeDomain: req.body.homeDomain,
					tomlUrl: req.body.tomlUrl,
					sourceReference: req.body.sourceReference,
					reason: req.body.reason,
					expiresAt,
					submitter: req.auth?.user ?? 'unknown'
				});
				return res.status(201).json(candidates);
			} catch (error) {
				return res.status(400).json({
					error: error instanceof Error ? error.message : 'Invalid submission'
				});
			}
		}
	);

	router.patch(
		'/endpoint-candidates/:candidateId',
		async (req: express.Request, res: express.Response) => {
			if (typeof req.body.enabled !== 'boolean')
				return res.status(400).json({ error: 'enabled must be a boolean' });
			try {
				const candidate = await config.service.update(req.params.candidateId, {
					enabled: req.body.enabled,
					expiresAt: parseOptionalDate(req.body.expiresAt)
				});
				return candidate
					? res.json(candidate)
					: res.status(404).json({ error: 'Candidate not found' });
			} catch (error) {
				return res.status(400).json({
					error: error instanceof Error ? error.message : 'Invalid update'
				});
			}
		}
	);

	router.post(
		'/endpoint-candidates/:candidateId/probe',
		async (req: express.Request, res: express.Response) => {
			try {
				return res.json(await config.service.probe(req.params.candidateId));
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Endpoint probe failed';
				return res
					.status(message.includes('not found') ? 404 : 400)
					.json({ error: message });
			}
		}
	);

	router.post(
		'/networks/:networkId/scans',
		async (req: express.Request, res: express.Response) => {
			if (req.params.networkId !== config.networkId)
				return res.status(404).json({ error: 'Network not found' });
			void config.scanNetwork.execute({ updateNetwork: false, dryRun: false });
			return res.status(202).json({ status: 'scan_requested' });
		}
	);

	return router;
};

function parseOptionalDate(value: unknown): Date | null | undefined {
	if (value === undefined) return undefined;
	if (value === null) return null;
	if (typeof value !== 'string') throw new Error('expiresAt must be ISO-8601');
	const date = new Date(value);
	if (Number.isNaN(date.getTime()))
		throw new Error('expiresAt must be ISO-8601');
	return date;
}
