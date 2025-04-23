import 'reflect-metadata';

import Kernel from '../../../core/infrastructure/Kernel';
import { ExceptionLogger } from '../../../core/services/ExceptionLogger';
import { Logger } from '../../../core/services/Logger';
import { NodeRepository } from '../../domain/node/NodeRepository';
import { GeoDataService } from '../../domain/node/scan/GeoDataService';
import NodeGeoDataLocation from '../../domain/node/NodeGeoDataLocation';

// noinspection JSIgnoredPromiseFromCall
run();

async function run() {
    const kernel = await Kernel.getInstance();
    const logger = kernel.container.get<Logger>('Logger');
    const exceptionLogger = kernel.container.get<ExceptionLogger>('ExceptionLogger');
    const nodeRepository = kernel.container.get<NodeRepository>('NodeRepository');
    const geoDataService = kernel.container.get<GeoDataService>('GeoDataService');

    try {
        const nodes = await nodeRepository.findActive();
        logger.info('Found ' + nodes.length + ' nodes to update');

        for (const node of nodes) {
            const ip = node.ip;
            if (!ip) continue;

            logger.info('Updating geo data for node', { ip });
            const result = await geoDataService.fetchGeoData(ip);
            
            if (result.isErr()) {
                logger.error('Failed to fetch geo data', { 
                    ip, 
                    error: result.error.message 
                });
                continue;
            }

            const geoData = result.value;
            const now = new Date();
            node.updateGeoData(
                NodeGeoDataLocation.create({
                    latitude: geoData.latitude,
                    longitude: geoData.longitude,
                    countryCode: geoData.countryCode,
                    countryName: geoData.countryName
                }),
                now
            );
            if (geoData.isp) {
                node.updateIsp(geoData.isp, now);
            }
            
            await nodeRepository.save([node], now);
            logger.info('Updated geo data for node', { ip });
        }

        logger.info('Finished updating geo data for all nodes');
    } catch (error) {
        const message = 'Unexpected error while updating geo data';
        if (error instanceof Error) {
            logger.error(message, { errorMessage: error.message });
            exceptionLogger.captureException(error);
        } else {
            logger.error(message);
            exceptionLogger.captureException(
                new Error('Unexpected error during geo data update: ' + error)
            );
        }
    }

    logger.info('Shutting down kernel');
    await kernel.shutdown();
    logger.info('Done');
} 