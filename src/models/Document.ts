import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  _id: string;
  batchId: string;
  userId: string;
  documentType: 'CERFA' | 'CONVENTION' | 'REPORT';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

const documentSchema = new Schema<IDocument>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    batchId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    documentType: {
      type: String,
      enum: ['CERFA', 'CONVENTION', 'REPORT'],
      default: 'CERFA',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    fileId: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    pdfUrl: { type: String },
    generatedAt: { type: Date },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ batchId: 1, status: 1 });
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ status: 1, createdAt: -1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
