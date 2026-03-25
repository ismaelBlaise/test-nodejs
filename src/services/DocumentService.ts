import { v4 as uuidv4 } from 'uuid';
import { Document, IDocument } from '../models/Document';
import logger, { createChildLogger } from '../config/logger';

export class DocumentService {
  /**
   * Create a new document record
   */
  async createDocument(
    batchId: string,
    userId: string,
    documentType: 'CERFA' | 'CONVENTION' | 'REPORT' = 'CERFA',
    metadata?: Record<string, unknown>
  ): Promise<IDocument> {
    const documentId = uuidv4();
    const childLogger = createChildLogger({ documentId, batchId, userId });

    try {
      const document = new Document({
        _id: documentId,
        batchId,
        userId,
        documentType,
        status: 'pending',
        retryCount: 0,
        metadata,
      });

      await document.save();
      childLogger.info('Document created');
      return document;
    } catch (error) {
      childLogger.error(error, 'Failed to create document');
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<IDocument | null> {
    try {
      const document = await Document.findById(documentId);
      return document;
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to get document');
      throw error;
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    updates?: Partial<IDocument>
  ): Promise<IDocument | null> {
    const childLogger = createChildLogger({ documentId, status });

    try {
      const document = await Document.findByIdAndUpdate(
        documentId,
        {
          status,
          ...(status === 'completed' && { generatedAt: new Date() }),
          ...updates,
        },
        { new: true }
      );

      childLogger.info('Document status updated');
      return document;
    } catch (error) {
      childLogger.error(error, 'Failed to update document status');
      throw error;
    }
  }

  /**
   * Get documents by batch
   */
  async getDocumentsByBatch(
    batchId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    documents: IDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        Document.find({ batchId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Document.countDocuments({ batchId }),
      ]);

      return {
        documents,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error, batchId }, 'Failed to get documents by batch');
      throw error;
    }
  }

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(status: string, limit: number = 100): Promise<IDocument[]> {
    try {
      const documents = await Document.find({ status }).limit(limit);
      return documents;
    } catch (error) {
      logger.error({ error, status }, 'Failed to get documents by status');
      throw error;
    }
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(documentId: string): Promise<void> {
    try {
      await Document.findByIdAndUpdate(documentId, { $inc: { retryCount: 1 } }, { new: true });
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to increment retry count');
      throw error;
    }
  }

  /**
   * Save file reference
   */
  async saveFileReference(
    documentId: string,
    fileId: string,
    fileName: string,
    fileSize: number
  ): Promise<IDocument | null> {
    const childLogger = createChildLogger({ documentId, fileId });

    try {
      const document = await Document.findByIdAndUpdate(
        documentId,
        {
          fileId,
          fileName,
          fileSize,
          pdfUrl: `/api/documents/${documentId}/download`,
        },
        { new: true }
      );

      childLogger.info({ fileName, fileSize }, 'File reference saved');
      return document;
    } catch (error) {
      childLogger.error(error, 'Failed to save file reference');
      throw error;
    }
  }
}

export default new DocumentService();
