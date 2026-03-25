import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Document Generation API',
      version: '1.0.0',
      description:
        'Ultra-optimized API for batch document generation with resilience and monitoring',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        BatchRequest: {
          type: 'object',
          required: ['userIds'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 10000,
              example: ['user-1', 'user-2', 'user-3'],
            },
          },
        },
        BatchResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                batchId: { type: 'string', format: 'uuid' },
                status: {
                  type: 'string',
                  enum: ['pending', 'processing', 'completed', 'failed'],
                },
                totalDocuments: { type: 'number' },
              },
            },
          },
        },
        Batch: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
            totalDocuments: { type: 'number' },
            processedDocuments: { type: 'number' },
            failedDocuments: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'object',
              properties: {
                totalDuration: { type: 'number' },
                cpuUsage: { type: 'number' },
                memoryUsage: { type: 'number' },
                documentsPerSecond: { type: 'number' },
                averageGenerationTime: { type: 'number' },
              },
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'uuid' },
            batchId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
            documentType: { type: 'string', enum: ['CERFA', 'CONVENTION', 'REPORT'] },
            pdfUrl: { type: 'string', format: 'uri' },
            fileSize: { type: 'number' },
            generatedAt: { type: 'string', format: 'date-time' },
            retryCount: { type: 'number' },
            errorMessage: { type: 'string' },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            uptime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            checks: {
              type: 'object',
              properties: {
                mongodb: { type: 'string', enum: ['UP', 'DOWN'] },
                redis: { type: 'string', enum: ['UP', 'DOWN'] },
                queue: { type: 'string', enum: ['UP', 'DOWN'] },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    tags: [
      {
        name: 'Batches',
        description: 'Batch document generation operations',
      },
      {
        name: 'Documents',
        description: 'Individual document operations',
      },
      {
        name: 'Health',
        description: 'Health check and monitoring',
      },
      {
        name: 'Metrics',
        description: 'Prometheus metrics endpoint',
      },
    ],
  },
  apis: ['./src/api/swagger.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
