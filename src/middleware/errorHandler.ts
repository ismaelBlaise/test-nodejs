import { Request, Response, NextFunction } from 'express';
import logger, { createChildLogger } from '../config/logger';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const childLogger = createChildLogger({
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  childLogger.info('Request received');

  // Log response time
  const originalSend = _res.send.bind(_res);
  _res.send = function (data: unknown) {
    const statusCode = _res.statusCode;
    childLogger.info({ statusCode }, 'Response sent');
    return originalSend(data);
  };

  next();
}

/**
 * Error handler middleware
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(error, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
}
