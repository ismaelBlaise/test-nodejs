import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';

describe('Batch Controller', () => {
  describe('POST /api/documents/batch', () => {
    it('should create a batch with valid user IDs', async () => {
      const response = await request(app)
        .post('/api/documents/batch')
        .send({
          userIds: ['user-1', 'user-2', 'user-3'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchId).toBeDefined();
      expect(response.body.data.totalDocuments).toBe(3);
      expect(response.body.data.status).toBe('processing');
    });

    it('should reject batch with empty user IDs', async () => {
      const response = await request(app).post('/api/documents/batch').send({
        userIds: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject batch with > 10000 user IDs', async () => {
      const userIds = Array.from({ length: 10001 }, (_, i) => `user-${i}`);

      const response = await request(app).post('/api/documents/batch').send({
        userIds,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documents/batch/:batchId', () => {
    it('should return 404 for non-existent batch', async () => {
      const response = await request(app).get('/api/documents/batch/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Health Check', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body.status).toBeDefined();
      expect(response.body.checks).toBeDefined();
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.memory).toBeDefined();
      expect(response.body.queue).toBeDefined();
    });
  });
});

describe('Metrics', () => {
  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('documents_generated_total');
    });
  });
});
