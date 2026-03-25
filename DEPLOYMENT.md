# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- MongoDB 5+
- Redis 6+

### Quick Start

```bash
# 1. Clone repository
git clone <repository>
cd document-generation-api

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start services with Docker Compose
npm run docker:up

# 5. Run migration (if needed)
npm run db:migrate

# 6. Start dev server
npm run dev
```

Visit `http://localhost:3000` (API) and `http://localhost:3000/api-docs` (Swagger UI)

## Docker Deployment

### Build Image

```bash
# Development image
docker build -f .docker/Dockerfile -t doc-gen-api:dev .

# Production image
docker build -f .docker/Dockerfile.prod -t doc-gen-api:prod .
```

### Run Container

```bash
docker run -d \
  --name doc-gen-api \
  -p 3000:3000 \
  -p 9090:9090 \
  -e MONGODB_URI=mongodb://mongo:27017/document-generation \
  -e REDIS_URL=redis://redis:6379 \
  -e NODE_ENV=production \
  --link mongodb \
  --link redis \
  doc-gen-api:prod
```

## Docker Compose Deployment

### Development

```bash
docker-compose up -d
docker-compose logs -f api
```

### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Cloud Deployment

### Render

1. Connect GitHub repository
2. Create New Web Service
3. Select Node environment
4. Set start command: `npm start`
5. Add environment variables:
   - `MONGODB_URI` - MongoDB connection string
   - `REDIS_URL` - Redis connection string
   - `NODE_ENV=production`

### Heroku

```bash
# Create app
heroku create doc-gen-api

# Add MongoDB and Redis add-ons
heroku addons:create heroku-postgresql
heroku addons:create heroku-redis

# Deploy
git push heroku main
```

### AWS ECS

1. Create ECR repository
2. Build and push Docker image
3. Create ECS task definition
4. Configure security groups and load balancer
5. Create ECS service

```bash
# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t doc-gen-api .
docker tag doc-gen-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/doc-gen-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/doc-gen-api:latest
```

### Kubernetes

1. Create Docker image and push to registry
2. Create deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: doc-gen-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: doc-gen-api
  template:
    metadata:
      labels:
        app: doc-gen-api
    spec:
      containers:
      - name: api
        image: <registry>/doc-gen-api:latest
        ports:
        - containerPort: 3000
        - containerPort: 9090
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: doc-gen-api-service
spec:
  selector:
    app: doc-gen-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

## Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string

### Optional
- `NODE_ENV` - Environment (development/production)
- `PORT` - API port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)
- `BULL_CONCURRENCY` - Queue concurrency (default: 10)
- `PDF_GENERATION_TIMEOUT` - PDF timeout in ms (default: 5000)

## Health Checks

### Liveness Probe
```
GET /health
```

### Readiness Probe
```
GET /health/detailed
```

## Monitoring

### Prometheus Metrics
```
GET /metrics
```

### Grafana Integration

1. Add Prometheus data source pointing to `http://localhost:9090`
2. Import dashboard ID `TODO` from Grafana Hub
3. Or create custom dashboard using available metrics

## Logging

Logs are emitted in JSON format with correlation IDs:

```json
{
  "level": 30,
  "time": "2024-09-15T10:30:45.123Z",
  "batchId": "batch-123",
  "documentId": "doc-123",
  "message": "Processing document"
}
```

### Log Aggregation

- **ElasticSearch**: Configure Filebeat to ship logs
- **CloudWatch**: Use AWS CloudWatch agent
- **Datadog**: Use Datadog agent for log collection
- **Splunk**: Configure Splunk forwarder

## Database

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://user:pass@host:27017/database" --out=./backup

# Restore backup
mongorestore --uri="mongodb://user:pass@host:27017/database" ./backup
```

### Redis Backup

```bash
# Create backup
redis-cli BGSAVE

# Copy dump.rdb to safe location
cp /var/lib/redis/dump.rdb /backups/
```

## CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Build Docker image
      run: docker build -f .docker/Dockerfile.prod -t doc-gen-api:latest .
    
    - name: Deploy to Render
      run: |
        curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
```

## Scaling

### Horizontal Scaling
1. Deploy multiple API instances
2. Use load balancer (nginx, HAProxy)
3. Share MongoDB and Redis instances

### Vertical Scaling
1. Increase `BULL_CONCURRENCY` for more parallel processing
2. Increase Node.js heap size: `NODE_OPTIONS=--max-old-space-size=4096`

### Queue Optimization
```env
BULL_CONCURRENCY=20
PDF_GENERATION_TIMEOUT=10000
```

## Troubleshooting

### Out of Memory
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

### Slow Document Generation
```bash
# Check queue size
curl http://localhost:9090/metrics | grep queue_size

# Reduce concurrency or increase timeout
BULL_CONCURRENCY=5 npm start
```

### MongoDB Connection Issues
```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI
```

### Redis Connection Issues
```bash
# Check connection
redis-cli -u $REDIS_URL ping

# Check memory
redis-cli -u $REDIS_URL info memory
```

## Support & Troubleshooting

- Check application logs: `docker-compose logs api`
- Review Prometheus metrics: `http://localhost:9090`
- Access Swagger API docs: `http://localhost:3000/api-docs`
- Check health status: `curl http://localhost:3000/health`
