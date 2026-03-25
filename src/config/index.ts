import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/document-generation',
    replicaSet: process.env.MONGODB_REPLICA_SET || 'rs0',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Queue Configuration
  queue: {
    name: process.env.BULL_QUEUE_NAME || 'document-generation',
    concurrency: parseInt(process.env.BULL_CONCURRENCY || '10', 10),
  },

  // PDF Generation
  pdf: {
    timeout: parseInt(process.env.PDF_GENERATION_TIMEOUT || '5000', 10),
    maxPages: parseInt(process.env.PDF_MAX_PAGES || '100', 10),
    dpi: parseInt(process.env.PDF_DPI || '96', 10),
  },

  // Circuit Breaker
  circuitBreaker: {
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000', 10),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Monitoring
  monitoring: {
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },

  // Security
  security: {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
};

export default config;
