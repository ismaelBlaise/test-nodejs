import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import config from './config/index';
import logger from './config/logger';
import QueueService from './services/QueueService';
import { requestLogger, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter, batchCreateLimiter } from './middleware/rateLimiter';
import routes from './api/routes';

// Initialize Bull job processor
import './workers/pdf-generator';

let app: Express;
let server: unknown;

async function initializeApp(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await getRedisClient();

    // Initialize queue
    await QueueService.initialize();

    // Create Express app
    app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors());
    app.use(compression());

    // Request logging
    app.use(requestLogger);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Rate limiting
    app.use('/api/', apiLimiter);
    app.use('/api/documents/batch', batchCreateLimiter);

    // API routes
    app.use('/api', routes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error(error, 'Failed to initialize application');
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    await initializeApp();

    server = app.listen(config.port, () => {
      logger.info({ port: config.port }, 'Server started');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await gracefulShutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await gracefulShutdown();
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

async function gracefulShutdown(): Promise<void> {
  try {
    logger.info('Graceful shutdown initiated');

    // Close HTTP server
    if (server && typeof server === 'object' && 'close' in server) {
      await new Promise<void>((resolve) => {
        (server as any).close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Close queue
    await QueueService.pauseQueue();
    await QueueService.close();
    logger.info('Queue service closed');

    // Close database connections
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  });
}

export { app, initializeApp };
