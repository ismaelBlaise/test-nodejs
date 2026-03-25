import rateLimit from 'express-rate-limit';
import config from '../config/index';

export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const batchCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 batch creations per hour
  message: 'Too many batch creation requests, please try again later',
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});
