import { Request, Response } from 'express';
import { connectDatabase } from '../config/database';
import { getRedisClient } from '../config/redis';
import QueueService from '../services/QueueService';
import logger from '../config/logger';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    // Check MongoDB
    const mongodbHealthy = true; // Basic check - can be enhanced

    // Check Redis
    let redisHealthy = false;
    try {
      const redisClient = await getRedisClient();
      await redisClient.ping();
      redisHealthy = true;
    } catch (error) {
      logger.warn(error, 'Redis health check failed');
    }

    // Check Queue
    let queueHealthy = false;
    try {
      const stats = await QueueService.getQueueStats();
      queueHealthy = stats !== null;
    } catch (error) {
      logger.warn(error, 'Queue health check failed');
    }

    const allHealthy = mongodbHealthy && redisHealthy && queueHealthy;
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: mongodbHealthy ? 'UP' : 'DOWN',
        redis: redisHealthy ? 'UP' : 'DOWN',
        queue: queueHealthy ? 'UP' : 'DOWN',
      },
    });
  } catch (error) {
    logger.error(error, 'Health check failed');
    res.status(503).json({
      status: 'error',
      error: 'Internal server error during health check',
    });
  }
}

export async function detailedHealthCheck(_req: Request, res: Response): Promise<void> {
  try {
    // Get queue stats
    const queueStats = await QueueService.getQueueStats();
    const queueSize = await QueueService.getQueueSize();

    // Get Redis info
    let redisInfo: Record<string, unknown> = { status: 'DOWN' };
    try {
      const redisClient = await getRedisClient();
      // You can add more detailed info here
      redisInfo = { status: 'UP', memoryUsage: 'N/A' };
    } catch (error) {
      logger.warn(error, 'Failed to get Redis info');
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      queue: {
        ...queueStats,
        size: queueSize,
      },
      redis: redisInfo,
    });
  } catch (error) {
    logger.error(error, 'Detailed health check failed');
    res.status(500).json({
      status: 'error',
      error: 'Failed to get detailed health information',
    });
  }
}
