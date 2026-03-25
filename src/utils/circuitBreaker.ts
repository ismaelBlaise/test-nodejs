import Opossum, { CircuitBreakerOptions } from 'opossum';
import axios, { AxiosInstance } from 'axios';
import config from '../config/index';
import logger from '../config/logger';

export class CircuitBreakerService {
  private breaker: Opossum<{ data: unknown }>;

  constructor() {
    const options: CircuitBreakerOptions = {
      timeout: config.circuitBreaker.timeout,
      errorThresholdPercentage: 50,
      resetTimeout: config.circuitBreaker.resetTimeout,
      name: 'DocumentGenerationBreaker',
    };

    this.breaker = new Opossum<{ data: unknown }>(this.externalCall.bind(this), options);

    this.breaker.fallback(() => ({
      data: { fallbackUsed: true, message: 'Service unavailable, using fallback' },
    }));

    this.breaker.on('open', () => {
      logger.warn('Circuit breaker opened - service is down');
    });

    this.breaker.on('halfOpen', () => {
      logger.info('Circuit breaker half-open - attempting recovery');
    });

    this.breaker.on('close', () => {
      logger.info('Circuit breaker closed - service is back up');
    });
  }

  private async externalCall(url: string, data: unknown): Promise<{ data: unknown }> {
    const response = await axios.post(url, data, {
      timeout: 5000,
    });
    return response.data;
  }

  async callExternalService(url: string, data: unknown): Promise<{ data: unknown }> {
    return this.breaker.fire(url, data);
  }

  getStatus(): string {
    if (this.breaker.opened) {
      return 'OPEN';
    }
    if (this.breaker.halfOpen) {
      return 'HALF_OPEN';
    }
    return 'CLOSED';
  }
}

export default new CircuitBreakerService();
