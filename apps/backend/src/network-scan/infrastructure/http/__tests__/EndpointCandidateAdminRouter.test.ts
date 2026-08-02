import express from 'express';
import request from 'supertest';
import { mock } from 'jest-mock-extended';
import { EndpointCandidateAdminService } from '../../../domain/node/endpoint/EndpointCandidateAdminService';
import ValidatorEndpointCandidate from '../../../domain/node/endpoint/ValidatorEndpointCandidate';
import { ScanNetwork } from '../../../use-cases/scan-network/ScanNetwork';
import { endpointCandidateAdminRouter } from '../EndpointCandidateAdminRouter';

describe('EndpointCandidateAdminRouter', () => {
	const service = mock<EndpointCandidateAdminService>();
	const scanNetwork = mock<ScanNetwork>();
	const app = express();
	app.use(express.json());
	app.use(
		'/v1/admin',
		endpointCandidateAdminRouter({
			service,
			scanNetwork,
			networkId: 'public',
			username: 'operator',
			password: 'secret'
		})
	);

	beforeEach(() => jest.clearAllMocks());

	it('requires basic authentication', async () => {
		await request(app)
			.get('/v1/admin/networks/public/endpoint-candidates')
			.expect(401)
			.expect('WWW-Authenticate', /Basic/);
	});

	it('lists candidates for the configured network', async () => {
		const candidate = ValidatorEndpointCandidate.create({
			networkId: 'public',
			ip: '20.187.166.130',
			port: 11625,
			source: 'operator_submission'
		});
		candidate.id = 'candidate-1';
		service.list.mockResolvedValue([candidate]);

		const response = await request(app)
			.get('/v1/admin/networks/public/endpoint-candidates')
			.auth('operator', 'secret')
			.expect(200);

		expect(response.body[0]).toMatchObject({
			id: 'candidate-1',
			ip: '20.187.166.130',
			port: 11625,
			state: 'unverified'
		});
	});

	it('submits a stellar.toml home domain with audit metadata', async () => {
		service.submit.mockResolvedValue([]);

		await request(app)
			.post('/v1/admin/networks/public/endpoint-candidates')
			.auth('operator', 'secret')
			.send({
				homeDomain: 'stellar.marketnode.com',
				reason: 'new validator discovery incident'
			})
			.expect(201, []);

		expect(service.submit).toHaveBeenCalledWith(
			expect.objectContaining({
				homeDomain: 'stellar.marketnode.com',
				reason: 'new validator discovery incident',
				submitter: 'operator'
			})
		);
	});

	it('accepts an authenticated scan trigger without waiting for the scan', async () => {
		scanNetwork.execute.mockResolvedValue(undefined as never);

		await request(app)
			.post('/v1/admin/networks/public/scans')
			.auth('operator', 'secret')
			.expect(202, { status: 'scan_requested' });

		expect(scanNetwork.execute).toHaveBeenCalledWith({
			updateNetwork: false,
			dryRun: false
		});
	});
});
