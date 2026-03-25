import { Register, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Register();

// Counters
export const documentsGeneratedTotal = new Counter({
  name: 'documents_generated_total',
  help: 'Total number of documents generated',
  labelNames: ['status', 'document_type'],
  registers: [register],
});

export const documentsFailedTotal = new Counter({
  name: 'documents_failed_total',
  help: 'Total number of failed document generations',
  labelNames: ['error_type'],
  registers: [register],
});

// Histograms
export const batchProcessingDuration = new Histogram({
  name: 'batch_processing_duration_seconds',
  help: 'Time taken to process a batch',
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

export const documentGenerationDuration = new Histogram({
  name: 'document_generation_duration_seconds',
  help: 'Time taken to generate a single document',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const documentUploadDuration = new Histogram({
  name: 'document_upload_duration_seconds',
  help: 'Time taken to upload document to storage',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Gauges
export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current size of the document generation queue',
  labelNames: ['queue_type'],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const processingDocuments = new Gauge({
  name: 'processing_documents',
  help: 'Number of documents currently being processed',
  registers: [register],
});

/**
 * Record document generation duration
 */
export function recordDocumentGenerationDuration(durationSeconds: number): void {
  documentGenerationDuration.observe(durationSeconds);
}

/**
 * Record batch processing duration
 */
export function recordBatchProcessingDuration(durationSeconds: number): void {
  batchProcessingDuration.observe(durationSeconds);
}

/**
 * Update queue size
 */
export function updateQueueSize(size: number, queueType: string = 'pending'): void {
  queueSize.set({ queue_type: queueType }, size);
}

/**
 * Increment successful document counter
 */
export function incrementDocumentsGenerated(
  status: string = 'success',
  type: string = 'CERFA'
): void {
  documentsGeneratedTotal.inc({ status, document_type: type });
}

/**
 * Increment failed documents counter
 */
export function incrementDocumentsFailed(errorType: string = 'unknown'): void {
  documentsFailedTotal.inc({ error_type: errorType });
}
