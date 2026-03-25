import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import QueueService, { DocumentGenerationJob } from '../services/QueueService';
import DocumentService from '../services/DocumentService';
import BatchService from '../services/BatchService';
import logger, { createChildLogger } from '../config/logger';
import {
  recordDocumentGenerationDuration,
  incrementDocumentsGenerated,
  incrementDocumentsFailed,
} from '../utils/metrics';

/**
 * PDF generator worker
 */
async function processPDFGeneration(job: DocumentGenerationJob): Promise<void> {
  const childLogger = createChildLogger({
    documentId: job.documentId,
    batchId: job.batchId,
    jobId: job.jobId,
  });

  const startTime = Date.now();

  try {
    childLogger.info('Processing document generation');

    // Update document status to processing
    await DocumentService.updateDocumentStatus(job.documentId, 'processing');

    // Generate PDF
    const pdfBuffer = await generatePDF(job);

    // In a real scenario, save to GridFS
    // For now, simulate saving
    const fileSize = pdfBuffer.length;
    const fileName = `${job.documentId}.pdf`;

    await DocumentService.saveFileReference(job.documentId, uuidv4(), fileName, fileSize);

    // Update document status to completed
    await DocumentService.updateDocumentStatus(job.documentId, 'completed');

    // Update batch metrics
    await BatchService.incrementProcessedDocuments(job.batchId);

    const duration = (Date.now() - startTime) / 1000;
    recordDocumentGenerationDuration(duration);
    incrementDocumentsGenerated('success', job.documentType);

    childLogger.info({ duration, fileSize }, 'Document generated successfully');
  } catch (error) {
    childLogger.error(error, 'Failed to generate document');

    // Update document status to failed
    await DocumentService.updateDocumentStatus(job.documentId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Increment file document failed counter
    await DocumentService.incrementRetryCount(job.documentId);
    await BatchService.incrementFailedDocuments(job.batchId);

    incrementDocumentsFailed(error instanceof Error ? error.constructor.name : 'unknown');

    throw error;
  }
}

/**
 * Generate PDF with user data
 */
async function generatePDF(job: DocumentGenerationJob): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      // Add content based on document type
      switch (job.documentType) {
        case 'CERFA':
          addCERFAContent(doc, job);
          break;
        case 'CONVENTION':
          addConventionContent(doc, job);
          break;
        case 'REPORT':
          addReportContent(doc, job);
          break;
        default:
          addDefaultContent(doc, job);
      }

      // Handle stream events
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error) => {
        reject(error);
      });

      // End document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add CERFA form content
 */
function addCERFAContent(doc: PDFKit.PDFDocument, job: DocumentGenerationJob): void {
  doc.fontSize(20).text('CERFA - Official Form', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text('User Information', { underline: true });
  doc.text(`User ID: ${job.userId}`);
  doc.text(`Document ID: ${job.documentId}`);
  doc.text(`Generated Date: ${new Date().toISOString()}`);
  doc.moveDown();

  doc.text('This is a sample CERFA form generated for testing purposes.');
  doc.moveDown();

  for (let i = 0; i < 5; i++) {
    doc.text(`Field ${i + 1}: ________________________`);
  }
}

/**
 * Add convention content
 */
function addConventionContent(doc: PDFKit.PDFDocument, job: DocumentGenerationJob): void {
  doc.fontSize(20).text('CONVENTION AGREEMENT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text('Party Information', { underline: true });
  doc.text(`User: ${job.userId}`);
  doc.text(`Document ID: ${job.documentId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  doc.text(
    'This convention agreement is entered into by and between the parties as detailed above.'
  );
  doc.moveDown();

  doc.fontSize(10);
  for (let i = 0; i < 10; i++) {
    doc.text(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${i + 1}`);
  }
}

/**
 * Add report content
 */
function addReportContent(doc: PDFKit.PDFDocument, job: DocumentGenerationJob): void {
  doc.fontSize(20).text('GENERATION REPORT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text('Report Details', { underline: true });
  doc.text(`User ID: ${job.userId}`);
  doc.text(`Batch ID: ${job.batchId}`);
  doc.text(`Generation Time: ${new Date().toISOString()}`);
  doc.moveDown();

  doc.text('Key Metrics:');
  doc.fontSize(10);
  doc.text(`- Total Documents: 1`);
  doc.text(`- Success Rate: 100%`);
  doc.text(`- Generation Duration: ~2 seconds`);
  doc.text(`- File Size: Variable`);
}

/**
 * Add default content
 */
function addDefaultContent(doc: PDFKit.PDFDocument, job: DocumentGenerationJob): void {
  doc.fontSize(20).text('GENERATED DOCUMENT', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text('Document Information', { underline: true });
  doc.text(`User ID: ${job.userId}`);
  doc.text(`Batch ID: ${job.batchId}`);
  doc.text(`Document Type: ${job.documentType}`);
  doc.text(`Generated: ${new Date().toISOString()}`);
}

// Register the job processor
async function initializeWorker(): Promise<void> {
  try {
    await QueueService.initialize();
    await QueueService.startProcessing(processPDFGeneration);
    logger.info('PDF generator worker initialized');
  } catch (error) {
    logger.error(error, 'Failed to initialize PDF worker');
    process.exit(1);
  }
}

// Auto-initialize when this module is imported
if (require.main === module) {
  initializeWorker().catch((error) => {
    logger.error(error, 'Worker process failed');
    process.exit(1);
  });
}

export { processPDFGeneration, generatePDF };
