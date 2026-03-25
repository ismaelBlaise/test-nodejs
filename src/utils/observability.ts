import { v4 as uuidv4 } from 'uuid';
import logger, { createChildLogger } from '../config/logger';
import {
  documentsGeneratedTotal,
  documentsFailedTotal,
  batchProcessingDuration,
  documentGenerationDuration,
  queueSize as queueSizeGauge,
  activeConnections,
  processingDocuments,
} from './metrics';
import QueueService from '../services/QueueService';

/**
 * Observability Service for comprehensive monitoring
 */
export class ObservabilityService {
  private correlationIdKey = 'x-correlation-id';
  private requestStartTimesMap = new Map<string, number>();

  /**
   * Generate or extract correlation ID
   */
  generateCorrelationId(existingId?: string): string {
    return existingId || uuidv4();
  }

  /**
   * Record batch processing start
   */
  recordBatchStart(batchId: string): void {
    const childLogger = createChildLogger({ batchId, event: 'batchStart' });
    this.requestStartTimesMap.set(`batch-${batchId}`, Date.now());
    childLogger.info('Batch processing started');
  }

  /**
   * Record batch processing completion
   */
  recordBatchCompletion(
    batchId: string,
    totalDocuments: number,
    successCount: number,
    failureCount: number
  ): void {
    const startTime = this.requestStartTimesMap.get(`batch-${batchId}`);
    const durationMs = startTime ? Date.now() - startTime : 0;
    const durationSeconds = durationMs / 1000;

    const childLogger = createChildLogger({
      batchId,
      event: 'batchCompletion',
      duration: durationSeconds,
    });

    // Record metrics
    batchProcessingDuration.observe(durationSeconds);
    documentsGeneratedTotal.inc({ status: 'success', document_type: 'CERFA' }, successCount);
    documentsGeneratedTotal.inc({ status: 'failed', document_type: 'CERFA' }, failureCount);

    childLogger.info(
      {
        totalDocuments,
        successCount,
        failureCount,
        successRate: ((successCount / totalDocuments) * 100).toFixed(2) + '%',
        durationSeconds: durationSeconds.toFixed(2),
        documentsPerSecond: (totalDocuments / durationSeconds).toFixed(2),
      },
      'Batch completed'
    );

    this.requestStartTimesMap.delete(`batch-${batchId}`);
  }

  /**
   * Record document generation start
   */
  recordDocumentStart(documentId: string, batchId: string): void {
    this.requestStartTimesMap.set(`doc-${documentId}`, Date.now());
    processingDocuments.inc();
  }

  /**
   * Record document generation completion
   */
  recordDocumentCompletion(documentId: string, batchId: string, fileSize?: number): void {
    const startTime = this.requestStartTimesMap.get(`doc-${documentId}`);
    const durationMs = startTime ? Date.now() - startTime : 0;
    const durationSeconds = durationMs / 1000;

    const childLogger = createChildLogger({
      documentId,
      batchId,
      event: 'documentCompletion',
    });

    // Record metrics
    documentGenerationDuration.observe(durationSeconds);
    processingDocuments.dec();

    childLogger.info(
      {
        duration: durationSeconds.toFixed(3),
        fileSize: fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'N/A',
      },
      'Document generated'
    );

    this.requestStartTimesMap.delete(`doc-${documentId}`);
  }

  /**
   * Record document generation failure
   */
  recordDocumentFailure(documentId: string, batchId: string, errorType: string): void {
    const childLogger = createChildLogger({
      documentId,
      batchId,
      event: 'documentFailure',
    });

    documentsFailedTotal.inc({ error_type: errorType });
    processingDocuments.dec();

    childLogger.warn({ errorType }, 'Document generation failed');
  }

  /**
   * Update queue metrics
   */
  async updateQueueMetrics(): Promise<void> {
    try {
      const size = await QueueService.getQueueSize();
      queueSizeGauge.set({ queue_type: 'pending' }, size);
    } catch (error) {
      logger.warn(error, 'Failed to update queue metrics');
    }
  }

  /**
   * Update active connections
   */
  updateActiveConnections(count: number): void {
    activeConnections.set(count);
  }

  /**
   * Get metrics snapshot
   */
  async getMetricsSnapshot(): Promise<{
    documentMetrics: Record<string, unknown>;
    queueMetrics: Record<string, unknown>;
    systemMetrics: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
      cpu: NodeJS.CpuUsage;
    };
  }> {
    const queueStats = await QueueService.getQueueStats();

    return {
      documentMetrics: {
        generated: documentsGeneratedTotal,
        failed: documentsFailedTotal,
      },
      queueMetrics: {
        ...queueStats,
      },
      systemMetrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }

  /**
   * Log structured event
   */
  logEvent(
    eventName: string,
    data: Record<string, unknown>,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const context = {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...data,
    };

    const childLogger = createChildLogger(context);
    childLogger[level](context, eventName);
  }
}

export default new ObservabilityService();
