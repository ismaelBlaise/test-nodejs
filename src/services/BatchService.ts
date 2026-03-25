import { v4 as uuidv4 } from 'uuid';
import { Batch, IBatch } from '../models/Batch';
import { Document } from '../models/Document';
import logger, { createChildLogger } from '../config/logger';

export class BatchService {
  /**
   * Create a new batch for document generation
   */
  async createBatch(userIds: string[]): Promise<IBatch> {
    const batchId = uuidv4();
    const childLogger = createChildLogger({ batchId, action: 'createBatch' });

    try {
      const batch = new Batch({
        _id: batchId,
        userIds,
        totalDocuments: userIds.length,
        status: 'pending',
      });

      await batch.save();
      childLogger.info({ userCount: userIds.length }, 'Batch created successfully');
      return batch;
    } catch (error) {
      childLogger.error(error, 'Failed to create batch');
      throw error;
    }
  }

  /**
   * Get batch by ID
   */
  async getBatchById(batchId: string): Promise<IBatch | null> {
    try {
      const batch = await Batch.findById(batchId);
      return batch;
    } catch (error) {
      logger.error({ error, batchId }, 'Failed to get batch');
      throw error;
    }
  }

  /**
   * Update batch status
   */
  async updateBatchStatus(
    batchId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    updates?: Partial<IBatch>
  ): Promise<IBatch | null> {
    const childLogger = createChildLogger({ batchId, status });

    try {
      const batch = await Batch.findByIdAndUpdate(
        batchId,
        {
          status,
          ...(status === 'processing' && { startedAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() }),
          ...(status === 'failed' && { completedAt: new Date() }),
          ...updates,
        },
        { new: true }
      );

      childLogger.info('Batch status updated');
      return batch;
    } catch (error) {
      childLogger.error(error, 'Failed to update batch status');
      throw error;
    }
  }

  /**
   * Update batch metrics
   */
  async updateBatchMetrics(
    batchId: string,
    metrics: Partial<IBatch['metrics']>
  ): Promise<IBatch | null> {
    const childLogger = createChildLogger({ batchId, action: 'updateMetrics' });

    try {
      const batch = await Batch.findByIdAndUpdate(
        batchId,
        { metrics: { ...metrics } },
        { new: true }
      );

      childLogger.info({ metrics }, 'Batch metrics updated');
      return batch;
    } catch (error) {
      childLogger.error(error, 'Failed to update batch metrics');
      throw error;
    }
  }

  /**
   * Get all batches with pagination
   */
  async getAllBatches(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    batches: IBatch[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const query = status ? { status } : {};
      const skip = (page - 1) * limit;

      const [batches, total] = await Promise.all([
        Batch.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Batch.countDocuments(query),
      ]);

      return {
        batches,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(error, 'Failed to get batches');
      throw error;
    }
  }

  /**
   * Increment processed documents counter
   */
  async incrementProcessedDocuments(batchId: string, count: number = 1): Promise<void> {
    try {
      await Batch.findByIdAndUpdate(
        batchId,
        { $inc: { processedDocuments: count } },
        { new: true }
      );
    } catch (error) {
      logger.error({ error, batchId, count }, 'Failed to increment processed documents');
      throw error;
    }
  }

  /**
   * Increment failed documents counter
   */
  async incrementFailedDocuments(batchId: string, count: number = 1): Promise<void> {
    try {
      await Batch.findByIdAndUpdate(batchId, { $inc: { failedDocuments: count } }, { new: true });
    } catch (error) {
      logger.error({ error, batchId, count }, 'Failed to increment failed documents');
      throw error;
    }
  }
}

export default new BatchService();
