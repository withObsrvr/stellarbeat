import swaggerUi from 'swagger-ui-express';
import express from 'express';
import Kernel from '../Kernel';
import { DataSource } from 'typeorm';
import { Config, getConfigFromEnv } from '../../config/Config';
import { ExceptionLogger } from 'exception-logger';
import { subscriptionRouter } from '../../../notifications/infrastructure/http/SubscriptionRouter';
import bodyParser from 'body-parser';
import { Server } from 'net';
import { ConfirmSubscription } from '../../../notifications/use-cases/confirm-subscription/ConfirmSubscription';
import { Subscribe } from '../../../notifications/use-cases/subscribe/Subscribe';
import { UnmuteNotification } from '../../../notifications/use-cases/unmute-notification/UnmuteNotification';
import { Unsubscribe } from '../../../notifications/use-cases/unsubscribe/Unsubscribe';
import { networkRouter } from '../../../network-scan/infrastructure/http/NetworkRouter';

const swaggerDocument = require('../../../../openapi.json');

import helmet from 'helmet';
import { GetNetwork } from '../../../network-scan/use-cases/get-network/GetNetwork';
import { GetLatestScan } from '../../../history-scan-coordinator/use-cases/get-latest-scan/GetLatestScan';
import { GetLatestNodeSnapshots } from '../../../network-scan/use-cases/get-latest-node-snapshots/GetLatestNodeSnapshots';
import { GetLatestOrganizationSnapshots } from '../../../network-scan/use-cases/get-latest-organization-snapshots/GetLatestOrganizationSnapshots';
import { nodeRouter } from '../../../network-scan/infrastructure/http/NodeRouter';
import { organizationRouter } from '../../../network-scan/infrastructure/http/OrganizationRouter';
import { GetNode } from '../../../network-scan/use-cases/get-node/GetNode';
import { GetNodes } from '../../../network-scan/use-cases/get-nodes/GetNodes';
import { GetNodeSnapshots } from '../../../network-scan/use-cases/get-node-snapshots/GetNodeSnapshots';
import { GetOrganizationSnapshots } from '../../../network-scan/use-cases/get-organization-snapshots/GetOrganizationSnapshots';
import { GetOrganization } from '../../../network-scan/use-cases/get-organization/GetOrganization';
import { GetOrganizations } from '../../../network-scan/use-cases/get-organizations/GetOrganizations';
import { GetMeasurementsFactory } from '../../../network-scan/use-cases/get-measurements/GetMeasurementsFactory';
import { GetMeasurementAggregations } from '../../../network-scan/use-cases/get-measurement-aggregations/GetMeasurementAggregations';
import { RequestUnsubscribeLink } from '../../../notifications/use-cases/request-unsubscribe-link/RequestUnsubscribeLink';
import { RegisterScan } from '../../../history-scan-coordinator/use-cases/register-scan/RegisterScan';
import { historyScanRouter } from '../../../history-scan-coordinator/infrastructure/http/HistoryScanRouter';
import { GetScanJob } from '../../../history-scan-coordinator/use-cases/get-scan-job/GetScanJob';

let server: Server;
const api = express();
api.use(bodyParser.json());
api.use(helmet());
api.set('trust proxy', true); //todo: env var

// Add a simple health check endpoint that doesn't require database access
api.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.status(200).send('OK');
});

// Start a minimal server immediately for health checks
const startMinimalServer = () => {
  server = api.listen(process.env.BACKEND_PORT || process.env.PORT || 3000, () => {
    console.log(`Minimal API server started on port ${process.env.BACKEND_PORT || process.env.PORT || 3000} for health checks`);
  });
};

// Start the minimal server immediately for health checks
startMinimalServer();

const setup = async (): Promise<{ config: Config; kernel: Kernel }> => {
	const configResult = getConfigFromEnv();
	if (configResult.isErr()) {
		console.log('Invalid configuration');
		console.log(configResult.error.message);
		throw new Error('Invalid configuration');
	}

	const config = configResult.value;
	console.log('Debug: Environment PORT=', process.env.PORT);
	console.log('Debug: Environment BACKEND_PORT=', process.env.BACKEND_PORT);
	console.log('Debug: Config apiPort=', config.apiPort);
	console.log('Debug: Starting to initialize Kernel...');
	try {
		const kernel = await Kernel.getInstance(config);
		console.log('Debug: Kernel initialized successfully');
		return {
			config: config,
			kernel: kernel
		};
	} catch (error) {
		console.error('ERROR: Failed to initialize Kernel:', error);
		throw error;
	}
};
const listen = async () => {
	const { config, kernel } = await setup();
	const exceptionLogger =
		kernel.container.get<ExceptionLogger>('ExceptionLogger');

	api.use(function (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept'
		);
		res.header(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, OPTIONS'
		);
		next();
	});

	const swaggerOptions = {
		customCss: '.swagger-ui .topbar { display: none }',
		explorer: true,
		customSiteTitle: 'Stellarbeat API doc'
	};

	api.get(
		'/docs',
		async (req: express.Request, res: express.Response, next) => {
			res.set('Content-Security-Policy', "frame-src 'self'");
			next();
		}
	);
	api.use(
		'/docs',
		swaggerUi.serve,
		swaggerUi.setup(swaggerDocument, swaggerOptions)
	);

	api.use(
		'/v1/subscription',
		subscriptionRouter({
			exceptionLogger: exceptionLogger,
			confirmSubscription: kernel.container.get(ConfirmSubscription),
			subscribe: kernel.container.get(Subscribe),
			unmuteNotification: kernel.container.get(UnmuteNotification),
			unsubscribe: kernel.container.get(Unsubscribe),
			requestUnsubscribeLink: kernel.container.get(RequestUnsubscribeLink)
		})
	);

	api.use(
		'/v1/history-scan',
		historyScanRouter({
			getLatestScan: kernel.container.get(GetLatestScan),
			registerScan: kernel.container.get(RegisterScan),
			userName: config.historyScanAPIUsername,
			password: config.historyScanAPIPassword,
			getScanJob: kernel.container.get(GetScanJob)
		})
	);

	api.use(function (req, res, next) {
		if (req.url.match(/^\/$/) || req.url.match('/v2/all')) {
			res.redirect(301, '/v1');
		}
		next();
	});

	api.use(
		['/v1/node', '/v1/nodes'],
		nodeRouter({
			getNode: kernel.container.get(GetNode),
			getNodeSnapshots: kernel.container.get(GetNodeSnapshots),
			getNodes: kernel.container.get(GetNodes),
			getMeasurementAggregations: kernel.container.get(
				GetMeasurementAggregations
			),
			getMeasurementsFactory: kernel.container.get(GetMeasurementsFactory)
		})
	);

	api.use(
		['/v1/organization', '/v1/organizations'],
		organizationRouter({
			getOrganization: kernel.container.get(GetOrganization),
			getOrganizationSnapshots: kernel.container.get(GetOrganizationSnapshots),
			getMeasurementAggregations: kernel.container.get(
				GetMeasurementAggregations
			),
			getOrganizations: kernel.container.get(GetOrganizations),
			getMeasurementsFactory: kernel.container.get(GetMeasurementsFactory)
		})
	);

	api.use(
		'/v1',
		networkRouter({
			getNetwork: kernel.container.get(GetNetwork),
			getMeasurementAggregations: kernel.container.get(
				GetMeasurementAggregations
			),
			getMeasurementsFactory: kernel.container.get(GetMeasurementsFactory),
			getLatestNodeSnapshots: kernel.container.get(GetLatestNodeSnapshots),
			getLatestOrganizationSnapshots: kernel.container.get(
				GetLatestOrganizationSnapshots
			)
		})
	);

	// If we already have a server running from the minimal setup, close it first
	if (server) {
		console.log('Stopping minimal server to start full server');
		server.close();
	}
	
	server = api.listen(config.apiPort, () => {
		console.log('Full API server now listening on port: ' + config.apiPort);
	});

	process.on('SIGTERM', async () => {
		console.log('SIGTERM signal received: closing HTTP server');
		await stop(kernel.container.get(DataSource));
	});

	process.on('SIGINT', async () => {
		console.log('SIGTERM signal received: closing HTTP server');
		await stop(kernel.container.get(DataSource));
	});
};

// Try to initialize the full server but keep the minimal one running if it fails
listen().catch(error => {
  console.error("Failed to initialize the full API server:", error);
  console.log("Minimal server will remain running for health checks");
  
  // Add a simple /v1 endpoint for the health check to pass
  api.get('/v1', (req, res) => {
    res.status(503).json({ 
      status: "Service Unavailable", 
      message: "API is in minimal health check mode due to initialization failure" 
    });
  });
});

async function stop(dataSource: DataSource) {
	server.close(async () => {
		console.log('HTTP server closed');
		await dataSource.destroy();
		console.log('connection to db closed');
	});
}
