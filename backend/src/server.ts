import { FanzEcosystemApp } from './app';
import { config } from './config';
import { Logger } from './utils/logger';

const logger = new Logger('Server');

async function startServer() {
  try {
    const app = new FanzEcosystemApp();
    const port = config.PORT;

    await app.start(port);

    logger.info('🚀 FANZ Unified Ecosystem Server Started Successfully!', {
      port,
      environment: config.NODE_ENV,
      processId: process.pid,
      nodeVersion: process.version,
      features: {
        websockets: config.ENABLE_WEBSOCKETS,
        blockchain: config.ENABLE_BLOCKCHAIN,
        aiFeatures: config.ENABLE_AI_FEATURES,
        playground: config.ENABLE_PLAYGROUND
      }
    });

  } catch (error) {
    logger.error('Failed to start FANZ Ecosystem Server', {
      error: (error instanceof Error ? error.message : String(error)),
      stack: (error instanceof Error ? error.stack : undefined)
    });
    process.exit(1);
  }
}

// Start the server
startServer();