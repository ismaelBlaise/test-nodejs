import { Request, Response } from 'express';
import BatchService from '../services/BatchService';
import DocumentService from '../services/DocumentService';
import QueueService, { DocumentGenerationJob } from '../services/QueueService';
import logger, { createChildLogger } from '../config/logger';
import validateBatchRequest from '../utils/validators';

export class BatchController {
  /**
   * POST /api/documents/batch
   * Create a new batch of documents for generation
   */
  async createBatch(req: Request, res: Response): Promise<void> {
    const childLogger = createChildLogger({
      action: 'createBatch',
      ip: req.ip,
    });

    try {
      // Validate request
      const { error, value } = validateBatchRequest(req.body);
      if (error) {
        childLogger.warn({ error: error.message }, 'Invalid batch request');
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      const { userIds } = value;

      // Create batch
      const batch = await BatchService.createBatch(userIds);

      // Update logger context
      childLogger.info.call(createChildLogger({ batchId: batch._id }), 'Batch created');

      // Create document records and queue jobs
      const queueLogger = createChildLogger({ batchId: batch._id });
      try {
        await BatchService.updateBatchStatus(batch._id, 'processing', {
          startedAt: new Date(),
        });

        for (const userId of userIds) {
          const document = await DocumentService.createDocument(batch._id, userId);

          const job: DocumentGenerationJob = {
            documentId: document._id,
            batchId: batch._id,
            userId,
            documentType: 'CERFA',
          };

          // Queue the job with random delay to distribute load
          const delay = Math.random() * 5000; // Max 5s delay
          await QueueService.addJob(job, delay);
        }

        queueLogger.info({ documentCount: userIds.length }, 'All documents queued for processing');
      } catch (error) {
        queueLogger.error(error, 'Failed to queue documents');
        await BatchService.updateBatchStatus(batch._id, 'failed', {
          errorMessage: 'Failed to queue documents',
        });
        throw error;
      }

      res.status(201).json({
        success: true,
        data: {
          batchId: batch._id,
          status: batch.status,
          totalDocuments: batch.totalDocuments,
        },
      });
    } catch (error) {
      childLogger.error(error, 'Failed to create batch');
      res.status(500).json({
        success: false,
        error: 'Failed to create batch',
      });
    }
  }

  /**
   * GET /api/documents/batch/:batchId
   * Get batch status and documents
   */
  async getBatchStatus(req: Request, res: Response): Promise<void> {
    const { batchId } = req.params;
    const childLogger = createChildLogger({
      batchId,
      action: 'getBatchStatus',
    });

    try {
      const batch = await BatchService.getBatchById(batchId);
      if (!batch) {
        childLogger.warn('Batch not found');
        res.status(404).json({
          success: false,
          error: 'Batch not found',
        });
        return;
      }

      const { documents, total } = await DocumentService.getDocumentsByBatch(batchId);

      res.status(200).json({
        success: true,
        data: {
          batch: {
            _id: batch._id,
            status: batch.status,
            totalDocuments: batch.totalDocuments,
            processedDocuments: batch.processedDocuments,
            failedDocuments: batch.failedDocuments,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
            startedAt: batch.startedAt,
            completedAt: batch.completedAt,
            metrics: batch.metrics,
          },
          documents: documents.map((doc) => ({
            _id: doc._id,
            userId: doc.userId,
            status: doc.status,
            documentType: doc.documentType,
            pdfUrl: doc.pdfUrl,
            retryCount: doc.retryCount,
            errorMessage: doc.errorMessage,
          })),
          pagination: { total, count: documents.length },
        },
      });
    } catch (error) {
      childLogger.error(error, 'Failed to get batch status');
      res.status(500).json({
        success: false,
        error: 'Failed to get batch status',
      });
    }
  }

  /**
   * GET /api/documents/batches
   * Get all batches with pagination
   */
  async getAllBatches(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));

    try {
      const result = await BatchService.getAllBatches(pageNum, limitNum, status as string);

      res.status(200).json({
        success: true,
        data: {
          batches: result.batches,
          pagination: {
            total: result.total,
            page: result.page,
            pages: result.pages,
            limit: limitNum,
          },
        },
      });
    } catch (error) {
      logger.error(error, 'Failed to get batches');
      res.status(500).json({
        success: false,
        error: 'Failed to get batches',
      });
    }
  }
}

export default new BatchController();
