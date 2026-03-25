import { Request, Response } from 'express';
import { register } from '../utils/metrics';
import logger from '../config/logger';

export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (error) {
    logger.error(error, 'Failed to get metrics');
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
    });
  }
}
