# Document Generation API

Ultra-optimized API for batch document generation with resilience and monitoring.

## 📋 Features

- ✅ Batch document generation (up to 10,000 documents per batch)
- ✅ Asynchronous processing with Bull queue (Redis-backed)
- ✅ PDF generation with Worker Threads for parallelization
- ✅ Resilience with circuit breakers and automatic retries
- ✅ Comprehensive observability with Prometheus metrics and structured logging
- ✅ MongoDB storage with GridFS for PDFs
- ✅ REST API with Swagger/OpenAPI documentation
- ✅ Health checks and monitoring endpoints
- ✅ Rate limiting and security middleware
- ✅ Docker Compose setup for quick deployment

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js API Server                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Endpoints:                                            │ │
│  │  • POST   /api/documents/batch                         │ │
│  │  • GET    /api/documents/batch/:id                     │ │
│  │  • GET    /api/documents/:id                           │ │
│  │  • GET    /health, /metrics                            │ │
│  └────────────────────────────────────────────────────────┘ │
└────────┬─────────────────────────────┬─────────────────────┘
         │                             │
    ┌────▼────┐              ┌─────────▼─────────┐
    │ MongoDB │              │ Bull Queue (Redis)│
    │         │              │                   │
    │ Batches │              │ Document Jobs     │
    │Documents│              │ 10 concurrent     │
    │ (GridFS)│              └─────────┬─────────┘
    └─────────┘                        │
                                       ▼
                        ┌──────────────────────────┐
                        │  PDF Generator Workers   │
                        │  (TypeScript)            │
                        │  • Template Rendering    │
                        │  • PDF Generation        │
                        │  • Storage (GridFS)      │
                        └──────────────────────────┘
```

### Request Flow for Batch Processing

```
Client Request
    │
    ▼
POST /api/documents/batch with user IDs
    │
    ▼
Create Batch (MongoDB)
    │
    ▼
Generate Document Records
    │
    ▼
Queue Jobs (Bull/Redis) - Max 10 concurrent
    │
    ├─► Job 1 ┐
    ├─► Job 2 │
    ├─► Job 3 ├─► PDF Generator Workers
    └─► Job N ┘
         │
         ▼
    Generate PDF (Worker Thread)
         │
         ▼
    Save to MongoDB (GridFS)
         │
         ▼
    Update Document Status
         │
         ▼
    Return Batch ID (Client polls status)
         │
         ▼
    GET /api/documents/batch/{batchId}
         │
         ▼
    Return Batch Status & Documents
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd document-generation-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start services with Docker Compose
npm run docker:up

# Wait for services to be healthy (30s)
sleep 30

# Run the application
npm run dev
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## 📚 API Documentation

### Swagger UI

Once the server is running, visit:

```
http://localhost:3000/api-docs
```

### Create a Batch

```bash
curl -X POST http://localhost:3000/api/documents/batch \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-1", "user-2", "user-3"]
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "batchId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "totalDocuments": 3
  }
}
```

### Check Batch Status

```bash
curl http://localhost:3000/api/documents/batch/550e8400-e29b-41d4-a716-446655440000
```

### Get Document Details

```bash
curl http://localhost:3000/api/documents/{documentId}
```

### Download PDF

```bash
curl -O http://localhost:3000/api/documents/{documentId}/download
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Prometheus Metrics

```bash
curl http://localhost:9090/metrics
```

## 📊 Monitoring

### Prometheus Metrics

Available metrics:

- `documents_generated_total` - Total documents generated
- `batch_processing_duration_seconds` - Batch processing time
- `document_generation_duration_seconds` - Individual document time
- `queue_size` - Current queue size
- `active_connections` - Connected clients

### Structured Logging

Logs are emitted in JSON format with correlation IDs:

```json
{
  "level": 30,
  "time": "2024-09-15T10:30:45.123Z",
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "documentId": "document-123",
  "action": "generateDocument",
  "message": "Document generated successfully",
  "duration": 2.5
}
```

### Health Endpoints

- `GET /health` - Quick health status
- `GET /health/detailed` - Detailed metrics (memory, CPU, queue stats)

## 🔧 Configuration

Environment variables (see `.env.example`):

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/document-generation
MONGODB_REPLICA_SET=rs0

# Redis
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# Queue
BULL_QUEUE_NAME=document-generation
BULL_CONCURRENCY=10

# PDF Generation
PDF_GENERATION_TIMEOUT=5000
PDF_MAX_PAGES=100

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## 🧪 Benchmarking

Run the benchmark script:

```bash
npm run benchmark
```

This will:

1. Generate 1000 user IDs
2. Create a batch
3. Process all documents
4. Print performance metrics (docs/sec, avg duration, etc.)

Sample output:

```
╔════════════════════════════════════════════════════════════╗
║         DOCUMENT GENERATION BENCHMARK REPORT               ║
╚════════════════════════════════════════════════════════════╝

📊 OVERVIEW
Total Documents:         1000
Total Duration:          120.45s
Status:                  SUCCESS

⚡ PERFORMANCE METRICS
Documents/Second:        8.30
Avg Time/Document:       0.120s

📈 SUCCESS RATE
Successful Documents:    100%
Failed Documents:        0%
```

## 🛡️ Resilience Features

### Retry Strategy

- **Max Retries**: 3 attempts per document
- **Backoff**: Exponential (2s base)

### Circuit Breaker

- **Threshold**: 5 failures
- **Timeout**: 30 seconds
- **Reset Timeout**: 60 seconds

### Fallback Handling

- MongoDB unavailable → In-memory fallback
- Redis down → Local queue processing
- PDF generation timeout → Mark as failed, retry

### Graceful Shutdown

- Complete in-flight jobs before shutting down
- SIGTERM/SIGINT handling
- Connection cleanup (MongoDB, Redis)

## 📦 Project Structure

```
src/
├── api/
│   ├── routes.ts           # API route definitions
│   └── swagger.ts          # Swagger/OpenAPI documentation
├── config/
│   ├── index.ts            # Configuration management
│   ├── database.ts         # MongoDB connection
│   ├── redis.ts            # Redis client
│   └── logger.ts           # Pino logger setup
├── controllers/
│   ├── BatchController.ts  # Batch API handlers
│   ├── DocumentController.ts # Document API handlers
│   ├── HealthController.ts # Health check handlers
│   └── MetricsController.ts # Metrics endpoint
├── services/
│   ├── BatchService.ts     # Batch business logic
│   ├── DocumentService.ts  # Document business logic
│   └── QueueService.ts     # Bull queue management
├── models/
│   ├── Batch.ts            # Batch MongoDB schema
│   ├── Document.ts         # Document MongoDB schema
│   └── HealthCheck.ts      # Health check schema
├── middleware/
│   ├── errorHandler.ts     # Error handling middleware
│   └── rateLimiter.ts      # Rate limiting middleware
├── workers/
│   └── pdf-generator.ts    # PDF generation worker
├── utils/
│   ├── validators.ts       # Input validation schemas
│   ├── circuitBreaker.ts   # Circuit breaker pattern
│   └── metrics.ts          # Prometheus metrics
├── scripts/
│   └── benchmark.ts        # Benchmarking script
└── index.ts                # Application entry point
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Test with Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## 🔐 Security

- Helmet.js headers protection
- CORS configuration
- Rate limiting (1000 requests per 15 minutes)
- Input validation with Joi
- SQL injection protection (MongoDB)
- HTTPS ready (via reverse proxy)

## 📈 Performance Optimizations

### PDF Generation

- Cached templates (compile once)
- Worker threads for parallelization
- Streaming to storage (no in-memory buffering)
- Configurable concurrency (default: 10)

### Database

- Indexed queries (batchId, status, userId)
- GridFS for large PDFs
- TTL indexes for health checks
- Connection pooling

### Queue

- Job persistence in Redis
- Automatic retries with exponential backoff
- Job completion tracking
- Dead letter queue for failed jobs

### API

- Response compression (gzip)
- JSON payload size limits
- Connection pooling
- Async/await for non-blocking I/O

## 📝 Code Quality

- **TypeScript** strict mode
- **ESLint** configuration
- **Prettier** code formatting
- **Jest** for testing

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
# Build image
docker build -f .docker/Dockerfile.prod -t doc-gen-api:latest .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://... \
  -e REDIS_URL=redis://... \
  doc-gen-api:latest
```

### Environment Variables (Production)

Set these before deployment:

- `MONGODB_URI` - Production MongoDB connection
- `REDIS_URL` - Production Redis URL
- `NODE_ENV` - Set to 'production'
- `LOG_LEVEL` - Set to 'warn' or 'error'

## 📋 Technical Decisions

### Why Bull?

- **Reliable**: Job persistence, retry logic, dead-letter queue
- **Scalable**: Distributed processing across workers
- **Observable**: Built-in metrics and monitoring
- **Active**: Well-maintained, large community

### Why GridFS?

- **Large Files**: Handles PDFs > 16MB (BSON limit)
- **Streaming**: Efficient downloading without loading to memory
- **Replication**: Works with MongoDB replica sets
- **Built-in**: No additional storage service needed

### Why Pino?

- **Performance**: Faster than Winston for structured logging
- **Stream-based**: Flexible output (file, HTTP, etc.)
- **JSON**: Native structured logging support
- **Child loggers**: Easy context correlation

### Why Opossum?

- **Simple API**: Easy circuit breaker implementation
- **Configurable**: Customizable thresholds and timeouts
- **Observable**: State change events
- **Typed**: Full TypeScript support

## 🐛 Troubleshooting

### MongoDB Connection Failed

```bash
docker-compose ps  # Check if MongoDB is running
docker-compose logs mongodb  # Check MongoDB logs
```

### Queue Not Processing

```bash
# Check Redis connectivity
redis-cli ping

# Check queue size
curl http://localhost:3000/health/detailed
```

### High Memory Usage

- Reduce `BULL_CONCURRENCY`
- Enable PDF streaming to storage
- Implement periodic cleanup of old batches

## 📞 Support

- Issues: GitHub Issues
- Documentation: This README
- API Docs: Swagger UI at `/api-docs`

## 📄 License

MIT

---

**Last Updated**: September 2024  
**Version**: 1.0.0
