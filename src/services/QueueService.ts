import Bull, { Job, Queue } from 'bull';
import Redis from 'redis';
import config from '../config/index';
import logger, { createChildLogger } from '../config/logger';

export interface DocumentGenerationJob {
  documentId: string;
  batchId: string;
  userId: string;
  documentType: string;
  metadata?: Record<string, unknown>;
}

class QueueService {
  private queue: Queue<DocumentGenerationJob> | null = null;
  private redisClient: Redis.RedisClient | null = null;

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    try {
      // Parse Redis URL properly for Bull
      const redisUrl = new URL(config.redis.url);
      const host = redisUrl.hostname || 'localhost';
      const port = parseInt(redisUrl.port || '6379', 10);
      const password = redisUrl.password || undefined;
      const db = config.redis.db;

      this.queue = new Bull(config.queue.name, {
        redis: {
          host,
          port,
          password,
          db,
        },
        settings: {
          maxStalledCount: 2,
          lockDuration: 30000,
          lockRenewTime: 15000,
        },
      });

      // Connect to Redis for monitoring
      this.redisClient = Redis.createClient({
        url: config.redis.url,
      });

      await this.redisClient.connect();
      logger.info('Queue service initialized');
    } catch (error) {
      logger.error(error, 'Failed to initialize queue service');
      throw error;
    }
  }

  /**
   * Add a document generation job to the queue
   */
  async addJob(job: DocumentGenerationJob, delay?: number): Promise<Job<DocumentGenerationJob>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const childLogger = createChildLogger({
      documentId: job.documentId,
      batchId: job.batchId,
      action: 'addJob',
    });

    try {
      const bullJob = await this.queue.add(job, {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // keep completed jobs for 1 hour
        },
        removeOnFail: false,
      });

      childLogger.info({ jobId: bullJob.id }, 'Job added to queue');
      return bullJob;
    } catch (error) {
      childLogger.error(error, 'Failed to add job to queue');
      throw error;
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    try {
      const counts = await this.queue.getJobCounts();
      return counts.waiting + counts.active + counts.delayed;
    } catch (error) {
      logger.error(error, 'Failed to get queue size');
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    try {
      return await this.queue.getJobCounts();
    } catch (error) {
      logger.error(error, 'Failed to get queue stats');
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  /**
   * Process jobs from queue
   */
  async startProcessing(
    processor: (job: Job<DocumentGenerationJob>) => Promise<void>
  ): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    try {
      this.queue.process(config.queue.concurrency, processor);
      logger.info('Queue processing started');
    } catch (error) {
      logger.error(error, 'Failed to start queue processing');
      throw error;
    }
  }

  /**
   * Stop queue and clean up
   */
  async close(): Promise<void> {
    try {
      if (this.queue) {
        await this.queue.close();
      }
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      logger.info('Queue service closed');
    } catch (error) {
      logger.error(error, 'Failed to close queue service');
      throw error;
    }
  }

  /**
   * Get the Bull queue instance
   */
  getQueue(): Queue<DocumentGenerationJob> | null {
    return this.queue;
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    try {
      await this.queue.pause();
      logger.info('Queue paused');
    } catch (error) {
      logger.error(error, 'Failed to pause queue');
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    try {
      await this.queue.resume();
      logger.info('Queue resumed');
    } catch (error) {
      logger.error(error, 'Failed to resume queue');
      throw error;
    }
  }
}

export default new QueueService();
