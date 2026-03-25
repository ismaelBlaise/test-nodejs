import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthCheck extends Document {
  timestamp: Date;
  mongodb: boolean;
  redis: boolean;
  queue: boolean;
  uptime: number;
}

const healthCheckSchema = new Schema<IHealthCheck>(
  {
    timestamp: { type: Date, default: Date.now, index: { expires: 86400 } }, // TTL: 24h
    mongodb: Boolean,
    redis: Boolean,
    queue: Boolean,
    uptime: Number,
  },
  {
    timestamps: true,
  }
);

export const HealthCheck = mongoose.model<IHealthCheck>('HealthCheck', healthCheckSchema);
