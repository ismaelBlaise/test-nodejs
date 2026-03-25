import pino from 'pino';
import config from './index';

const transport =
  config.logging.format === 'json'
    ? undefined
    : pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      });

const logger = pino(
  {
    level: config.logging.level,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

/**
 * Utility function to create a child logger with merged context
 */
export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}

export default logger;
