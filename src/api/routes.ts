import { Router } from 'express';
import BatchController from '../controllers/BatchController';
import DocumentController from '../controllers/DocumentController';
import { healthCheck, detailedHealthCheck } from '../controllers/HealthController';
import { getMetrics } from '../controllers/MetricsController';

const router = Router();

/**
 * Batch endpoints
 */
router.post('/documents/batch', (req, res) => BatchController.createBatch(req, res));
router.get('/documents/batch/:batchId', (req, res) => BatchController.getBatchStatus(req, res));
router.get('/documents/batches', (req, res) => BatchController.getAllBatches(req, res));

/**
 * Document endpoints
 */
router.get('/documents/:documentId', (req, res) => DocumentController.getDocument(req, res));
router.get('/documents/:documentId/download', (req, res) =>
  DocumentController.downloadDocument(req, res)
);

/**
 * Health and monitoring endpoints
 */
router.get('/health', healthCheck);
router.get('/health/detailed', detailedHealthCheck);
router.get('/metrics', getMetrics);

export default router;
