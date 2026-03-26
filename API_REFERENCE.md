# API Quick Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication required. Future versions will support:

- API Key in `X-API-Key` header
- JWT Bearer tokens

## Rate Limiting

- General API: 1000 requests per 15 minutes
- Batch creation: 50 batches per hour

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Resource data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

## Endpoints

### Batches

#### Create Batch

```
POST /documents/batch
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"]
}
```

Response: `201 Created`

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

#### Get Batch Status

```
GET /documents/batch/{batchId}
```

Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "batch": {
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "totalDocuments": 3,
      "processedDocuments": 3,
      "failedDocuments": 0,
      "metrics": {
        "totalDuration": 15.2,
        "documentsPerSecond": 0.197,
        "averageGenerationTime": 5.07
      }
    },
    "documents": [
      {
        "_id": "doc-1",
        "batchId": "batch-1",
        "status": "completed",
        "pdfUrl": "/api/documents/doc-1/download"
      }
    ]
  }
}
```

#### List All Batches

```
GET /documents/batches?page=1&limit=20&status=completed
```

Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "batches": [
      /* array of batches */
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 5,
      "limit": 20
    }
  }
}
```

### Documents

#### Get Document Details

```
GET /documents/{documentId}
```

Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "doc-1",
    "batchId": "batch-1",
    "userId": "user-1",
    "status": "completed",
    "documentType": "CERFA",
    "pdfUrl": "/api/documents/doc-1/download",
    "fileSize": 102400
  }
}
```

#### Download PDF

```
GET /documents/{documentId}/download
```

Response: `200 OK` (PDF file stream)

### Health & Monitoring

#### Health Check

```
GET /health
```

Response: `200 OK` or `503 Service Unavailable`

```json
{
  "status": "healthy",
  "uptime": 3600.5,
  "checks": {
    "mongodb": "UP",
    "redis": "UP",
    "queue": "UP"
  }
}
```

#### Detailed Health

```
GET /health/detailed
```

Response: `200 OK`

```json
{
  "status": "ok",
  "uptime": 3600.5,
  "memory": {
    /* Node memory stats */
  },
  "cpu": {
    /* CPU usage */
  },
  "queue": {
    "waiting": 45,
    "active": 10,
    "completed": 1000,
    "failed": 5
  }
}
```

#### Prometheus Metrics

```
GET /metrics
```

Response: `200 OK` (text/plain in Prometheus format)

## Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK - Request succeeded                  |
| 201  | Created - Resource created              |
| 400  | Bad Request - Invalid input             |
| 404  | Not Found - Resource not found          |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Server Error - Internal error           |
| 503  | Service Unavailable - Dependencies down |

## Examples

### Using curl

```bash
# Create a batch
curl -X POST http://localhost:3000/api/documents/batch \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-1", "user-2"]}'

# Check status
curl http://localhost:3000/api/documents/batch/{batchId}

# Download document
curl http://localhost:3000/api/documents/{documentId}/download -o document.pdf

# Health check
curl http://localhost:3000/health
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/documents/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userIds: ['user-1', 'user-2'] }),
});

const { data } = await response.json();
const batchId = data.batchId;
```

### Using Python

```python
import requests

response = requests.post('http://localhost:3000/api/documents/batch', json={
    'userIds': ['user-1', 'user-2']
})
batch_id = response.json()['data']['batchId']
```

## Batch Statuses

| Status     | Meaning                                |
| ---------- | -------------------------------------- |
| pending    | Batch created, waiting to start        |
| processing | Batch is actively processing documents |
| completed  | All documents processed                |
| failed     | Batch encountered critical error       |

## Document Statuses

| Status     | Meaning                         |
| ---------- | ------------------------------- |
| pending    | Document queued for generation  |
| processing | Document generation in progress |
| completed  | Document generated successfully |
| failed     | Document generation failed      |

## Error Examples

### Invalid Request Body

```json
{
  "success": false,
  "error": "userIds array must contain at least 1 item"
}
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

### Service Unavailable

```json
{
  "success": false,
  "error": "Service is currently unavailable"
}
```
