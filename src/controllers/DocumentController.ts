import { Request, Response } from 'express';
import DocumentService from '../services/DocumentService';
import logger, { createChildLogger } from '../config/logger';

export class DocumentController {
  /**
   * GET /api/documents/:documentId
   * Get document details and download link
   */
  async getDocument(req: Request, res: Response): Promise<void> {
    const { documentId } = req.params;
    const childLogger = createChildLogger({
      documentId,
      action: 'getDocument',
    });

    try {
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        childLogger.warn('Document not found');
        res.status(404).json({
          success: false,
          error: 'Document not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          _id: document._id,
          batchId: document.batchId,
          userId: document.userId,
          status: document.status,
          documentType: document.documentType,
          pdfUrl: document.pdfUrl,
          fileSize: document.fileSize,
          generatedAt: document.generatedAt,
          retryCount: document.retryCount,
          errorMessage: document.errorMessage,
        },
      });
    } catch (error) {
      childLogger.error(error, 'Failed to get document');
      res.status(500).json({
        success: false,
        error: 'Failed to get document',
      });
    }
  }

  /**
   * GET /api/documents/:documentId/download
   * Download PDF file (streaming from GridFS)
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    const { documentId } = req.params;
    const childLogger = createChildLogger({
      documentId,
      action: 'downloadDocument',
    });

    try {
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        childLogger.warn('Document not found');
        res.status(404).json({
          success: false,
          error: 'Document not found',
        });
        return;
      }

      if (document.status !== 'completed' || !document.fileId) {
        childLogger.warn({ status: document.status }, 'Document not ready for download');
        res.status(400).json({
          success: false,
          error: 'Document not ready for download',
        });
        return;
      }

      // TODO: Stream PDF from GridFS
      // For now, return a placeholder
      res.status(200).json({
        success: true,
        message: 'PDF streaming would be implemented here',
        fileSize: document.fileSize,
      });
    } catch (error) {
      childLogger.error(error, 'Failed to download document');
      res.status(500).json({
        success: false,
        error: 'Failed to download document',
      });
    }
  }
}

export default new DocumentController();
