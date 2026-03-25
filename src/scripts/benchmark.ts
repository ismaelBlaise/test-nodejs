import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

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
  memoryStats?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

class BenchmarkService {
  private apiClient: AxiosInstance;
  private apiUrl: string;
  private documentTimings: number[] = [];

  constructor(apiUrl: string = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.apiClient = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
    });
  }

  /**
   * Run a benchmark test
   */
  async runBenchmark(
    documentCount: number = 1000,
    saveReport: boolean = true
  ): Promise<BenchmarkResult> {
    const startTime = new Date();
    const cpuStart = process.cpuUsage();
    const memStart = process.memoryUsage();

    logger.info({ documentCount }, 'Starting benchmark');
    console.log(`\n📊 Starting benchmark with ${documentCount} documents...\n`);

    try {
      // Generate user IDs
      const userIds = Array.from({ length: documentCount }, (_, i) => `user-${i + 1}`);

      // Create batch
      console.log('📦 Creating batch...');
      const batchResponse = await this.apiClient.post('/api/documents/batch', {
        userIds,
      });

      if (!batchResponse.data.success) {
        throw new Error('Failed to create batch');
      }

      const batchId = batchResponse.data.data.batchId;
      logger.info({ batchId, documentCount }, 'Batch created');
      console.log(`✅ Batch created: ${batchId}\n`);

      // Poll for completion
      let completed = false;
      let processedCount = 0;
      let failedCount = 0;
      let lastProcessedCount = 0;
      const pollIntervals: number[] = [];

      console.log('⏳ Monitoring batch processing...\n');
      console.log('Time (s) | Processed | Failed | Rate (docs/s) | ETA');
      console.log('---------|-----------|--------|---------------|------');

      while (!completed) {
        await this.delay(5000); // Poll every 5 seconds

        const statusResponse = await this.apiClient.get(`/api/documents/batch/${batchId}`);
        const batch = statusResponse.data.data.batch;
        const currentTime = (Date.now() - startTime.getTime()) / 1000;

        processedCount = batch.processedDocuments;
        failedCount = batch.failedDocuments;

        const incrementDocs = processedCount - lastProcessedCount;
        const rate = incrementDocs > 0 ? (incrementDocs / 5).toFixed(2) : '0.00';
        const remaining = documentCount - processedCount;
        const eta = remaining > 0 && parseFloat(rate) > 0 
          ? (remaining / parseFloat(rate)).toFixed(0) + 's'
          : '-';

        console.log(
          `${currentTime.toFixed(0).padStart(7)} | ${
            processedCount.toString().padStart(9)
          } | ${failedCount.toString().padStart(6)} | ${
            rate.padStart(13)
          } | ${eta}`
        );

        lastProcessedCount = processedCount;
        pollIntervals.push(currentTime);

        if (batch.status === 'completed' || batch.status === 'failed') {
          completed = true;
        }
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      const cpuEnd = process.cpuUsage(cpuStart);
      const memEnd = process.memoryUsage();

      const result: BenchmarkResult = {
        totalDocuments: documentCount,
        totalDuration: duration,
        startTime,
        endTime,
        documentsPerSecond: documentCount / duration,
        averageTimePerDocument: duration / documentCount,
        successRate: (processedCount / documentCount) * 100,
        failureRate: (failedCount / documentCount) * 100,
        minTime: 0,
        maxTime: 0,
        status: failedCount === 0 ? 'SUCCESS' : 'PARTIAL',
        memoryStats: {
          heapUsed: memEnd.heapUsed - memStart.heapUsed,
          heapTotal: memEnd.heapTotal - memStart.heapTotal,
          external: memEnd.external - memStart.external,
          rss: memEnd.rss - memStart.rss,
        },
        cpuUsage: {
          user: cpuEnd.user,
          system: cpuEnd.system,
        },
      };

      logger.info(result, 'Benchmark completed');

      if (saveReport) {
        this.saveReportToFile(result);
      }

      return result;
    } catch (error) {
      logger.error(error, 'Benchmark failed');
      throw error;
    }
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateReport(result: BenchmarkResult): string {
    const report = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                 DOCUMENT GENERATION BENCHMARK REPORT                           ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Documents:         ${result.totalDocuments.toLocaleString()}
Total Duration:          ${result.totalDuration.toFixed(2)}s
Status:                  ${result.status}
Test Date:               ${result.startTime.toLocaleString()}

⚡ PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Throughput:
  • Documents/Second:    ${result.documentsPerSecond.toFixed(2)} docs/s
  • Documents/Minute:    ${(result.documentsPerSecond * 60).toFixed(0)} docs/min
  • Documents/Hour:      ${(result.documentsPerSecond * 3600).toFixed(0)} docs/hour

Latency:
  • Avg Time/Document:   ${(result.averageTimePerDocument * 1000).toFixed(2)}ms
  • Total Time:          ${result.totalDuration.toFixed(2)}s

📈 SUCCESS RATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Successful Documents:    ${Math.round(result.successRate)}% (${Math.round((result.successRate * result.totalDocuments) / 100)} docs)
Failed Documents:        ${Math.round(result.failureRate)}% (${Math.round((result.failureRate * result.totalDocuments) / 100)} docs)

💾 RESOURCE USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Memory Usage:
  • Heap Used Delta:     ${(result.memoryStats?.heapUsed || 0) / 1024 / 1024).toFixed(2)} MB
  • Heap Total Delta:    ${(result.memoryStats?.heapTotal || 0) / 1024 / 1024).toFixed(2)} MB
  • RSS Delta:           ${(result.memoryStats?.rss || 0) / 1024 / 1024).toFixed(2)} MB
  • External Delta:      ${(result.memoryStats?.external || 0) / 1024).toFixed(2)} KB

CPU Usage:
  • User Time:           ${(result.cpuUsage?.user || 0) / 1000).toFixed(2)}ms
  • System Time:         ${(result.cpuUsage?.system || 0) / 1000).toFixed(2)}ms

⏱️  TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start Time:              ${result.startTime.toISOString()}
End Time:                ${result.endTime.toISOString()}
Duration:                ${result.totalDuration.toFixed(2)}s

╚════════════════════════════════════════════════════════════════════════════════╝
    `;

    return report;
  }

  /**
   * Save report to file
   */
  saveReportToFile(result: BenchmarkResult): void {
    const timestamp = result.startTime.toISOString().replace(/:/g, '-').split('T')[0];
    const reportDir = path.join(process.cwd(), 'reports');

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `benchmark-${timestamp}.txt`);
    const jsonPath = path.join(reportDir, `benchmark-${timestamp}.json`);

    const report = this.generateReport(result);
    fs.writeFileSync(reportPath, report);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    logger.info({ reportPath, jsonPath }, 'Reports saved');
    console.log(`\n📁 Reports saved to:\n  • ${reportPath}\n  • ${jsonPath}\n`);
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
  const documentCount = parseInt(process.argv[2] || '1000', 10);

  benchmark
    .runBenchmark(documentCount, true)
    .then((result) => {
      const report = benchmark.generateReport(result);
      console.log(report);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(error, 'Benchmark failed');
      console.error(`\n❌ Benchmark failed: ${error.message}\n`);
      process.exit(1);
    });
}

export default BenchmarkService;
