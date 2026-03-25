import logger, { createChildLogger } from '../config/logger';
import { getRedisClient } from '../config/redis';
import { connectDatabase } from '../config/database';
import QueueService from '../services/QueueService';

export interface HealthCheckResult {
  mongodb: boolean;
  redis: boolean;
  queue: boolean;
  timestamp: Date;
}

export class HealthCheckService {
  /**
   * Check all service dependencies
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const childLogger = createChildLogger({ action: 'healthCheck' });

    try {
      // Check MongoDB
      let mongoHealthy = false;
      try {
        const mongoose = (await import('mongoose')).default;
        mongoHealthy = mongoose.connection.readyState === 1;
      } catch (error) {
        childLogger.warn(error, 'MongoDB health check failed');
      }

      // Check Redis
      let redisHealthy = false;
      try {
        const redisClient = await getRedisClient();
        await redisClient.ping();
        redisHealthy = true;
      } catch (error) {
        childLogger.warn(error, 'Redis health check failed');
      }

      // Check Queue
      let queueHealthy = false;
      try {
        const stats = await QueueService.getQueueStats();
        queueHealthy = stats !== null;
      } catch (error) {
        childLogger.warn(error, 'Queue health check failed');
      }

      const result: HealthCheckResult = {
        mongodb: mongoHealthy,
        redis: redisHealthy,
        queue: queueHealthy,
        timestamp: new Date(),
      };

      childLogger.info(result, 'Health check completed');
      return result;
    } catch (error) {
      childLogger.error(error, 'Health check failed');
      throw error;
    }
  }

  /**
   * Check if system is healthy enough to process requests
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      // At least MongoDB and Queue should be healthy
      return health.mongodb && health.queue;
    } catch (error) {
      logger.error(error, 'Failed to determine health status');
      return false;
    }
  }

  /**
   * Get detailed system status
   */
  async getDetailedStatus(): Promise<{
    health: HealthCheckResult;
    system: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
      cpu: NodeJS.CpuUsage;
    };
  }> {
    return {
      health: await this.checkHealth(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }
}

export default new HealthCheckService();
