import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  _id: string;
  userIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metrics?: {
    totalDuration: number;
    cpuUsage: number;
    memoryUsage: number;
    documentsPerSecond: number;
    averageGenerationTime: number;
  };
}

const batchSchema = new Schema<IBatch>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    userIds: { type: [String], required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    totalDocuments: { type: Number, required: true },
    processedDocuments: { type: Number, default: 0 },
    failedDocuments: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    metrics: {
      totalDuration: Number,
      cpuUsage: Number,
      memoryUsage: Number,
      documentsPerSecond: Number,
      averageGenerationTime: Number,
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ status: 1, createdAt: -1 });
batchSchema.index({ _id: 1, status: 1 });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
