import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

interface BenchmarkResult {
  totalDocuments: number;
  totalDuration: number;
  startTime: Date;
  endTime: Date;
  documentsPerSecond: number;
  averageTimePerDocument: number;
  successRate: number;
  failureRate: number;
  minTime: number;
  maxTime: number;
  status: string;
}

class BenchmarkService {
  private apiClient: AxiosInstance;
  private apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 10000,
    });
  }

  /**
   * Run a benchmark test
   */
  async runBenchmark(documentCount: number = 1000): Promise<BenchmarkResult> {
    const startTime = new Date();
    logger.info({ documentCount }, 'Starting benchmark');

    try {
      // Generate user IDs
      const userIds = Array.from({ length: documentCount }, (_, i) => `user-${i + 1}`);

      // Create batch
      logger.info('Creating batch...');
      const batchResponse = await this.apiClient.post('/api/documents/batch', {
        userIds,
      });

      if (!batchResponse.data.success) {
        throw new Error('Failed to create batch');
      }

      const batchId = batchResponse.data.data.batchId;
      logger.info({ batchId }, 'Batch created');

      // Poll for completion
      let completed = false;
      let processedCount = 0;
      let failedCount = 0;
      const timings: number[] = [];

      while (!completed) {
        await this.delay(2000); // Wait 2 seconds before polling

        const statusResponse = await this.apiClient.get(`/api/documents/batch/${batchId}`);
        const batch = statusResponse.data.data.batch;

        processedCount = batch.processedDocuments;
        failedCount = batch.failedDocuments;

        logger.info(
          { processed: processedCount, failed: failedCount, total: batch.totalDocuments },
          'Batch progress'
        );

        if (batch.status === 'completed' || batch.status === 'failed') {
          completed = true;
        }
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      const result: BenchmarkResult = {
        totalDocuments: documentCount,
        totalDuration: duration,
        startTime,
        endTime,
        documentsPerSecond: documentCount / duration,
        averageTimePerDocument: duration / documentCount,
        successRate: (processedCount / documentCount) * 100,
        failureRate: (failedCount / documentCount) * 100,
        minTime: 0, // Would need to track individual times
        maxTime: 0, // Would need to track individual times
        status: failedCount === 0 ? 'SUCCESS' : 'PARTIAL',
      };

      logger.info(result, 'Benchmark completed');
      return result;
    } catch (error) {
      logger.error(error, 'Benchmark failed');
      throw error;
    }
  }

  /**
   * Generate benchmark report
   */
  generateReport(result: BenchmarkResult): string {
    const report = `
╔════════════════════════════════════════════════════════════╗
║         DOCUMENT GENERATION BENCHMARK REPORT               ║
╚════════════════════════════════════════════════════════════╝

📊 OVERVIEW
-----------
Total Documents:         ${result.totalDocuments}
Total Duration:          ${result.totalDuration.toFixed(2)}s
Status:                  ${result.status}

⚡ PERFORMANCE METRICS
---------------------
Documents/Second:        ${result.documentsPerSecond.toFixed(2)}
Avg Time/Document:       ${result.averageTimePerDocument.toFixed(3)}s
Min Time:                ${result.minTime.toFixed(3)}s
Max Time:                ${result.maxTime.toFixed(3)}s

📈 SUCCESS RATE
---------------
Successful Documents:    ${Math.round(result.successRate)}%
Failed Documents:        ${Math.round(result.failureRate)}%

⏱️  TIMELINE
-----------
Start Time:              ${result.startTime.toISOString()}
End Time:                ${result.endTime.toISOString()}

╚════════════════════════════════════════════════════════════╝
    `;

    return report;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run benchmark if executed directly
if (require.main === module) {
  const benchmark = new BenchmarkService();

  benchmark
    .runBenchmark(100) // Start with 100 documents for testing
    .then((result) => {
      const report = benchmark.generateReport(result);
      console.log(report);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(error, 'Benchmark failed');
      process.exit(1);
    });
}

export default BenchmarkService;
