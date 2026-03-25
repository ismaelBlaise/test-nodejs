/**
 * @swagger
 * /api/documents/batch:
 *   post:
 *     summary: Create a new batch for document generation
 *     description: Submit a batch of up to 10,000 user IDs for PDF document generation
 *     tags:
 *       - Batches
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10000
 *                 example: ["user-1", "user-2", "user-3"]
 *           example:
 *             userIds: ["user-1", "user-2", "user-3"]
 *     responses:
 *       201:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                       example: "processing"
 *                     totalDocuments:
 *                       type: number
 *                       example: 3
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 *
 * /api/documents/batch/{batchId}:
 *   get:
 *     summary: Get batch status and documents
 *     description: Retrieve the status of a batch and list of generated documents
 *     tags:
 *       - Batches
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Batch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     batch:
 *                       type: object
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Batch not found
 *       500:
 *         description: Server error
 *
 * /api/documents/batches:
 *   get:
 *     summary: Get all batches
 *     description: List all batches with pagination
 *     tags:
 *       - Batches
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *     responses:
 *       200:
 *         description: List of batches
 *       500:
 *         description: Server error
 *
 * /api/documents/{documentId}:
 *   get:
 *     summary: Get document details
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *
 * /api/documents/{documentId}/download:
 *   get:
 *     summary: Download PDF document
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file content
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Document not ready for download
 *       404:
 *         description: Document not found
 *
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 *
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Detailed health information
 *
 * /metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: Prometheus format metrics
 */

export {};
