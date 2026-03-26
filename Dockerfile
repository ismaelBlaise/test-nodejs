# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY tsconfig.json .
COPY .eslintrc.json .
COPY .prettierrc .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy configuration
COPY .env.example .env

# Create reports directory
RUN mkdir -p /app/reports && chmod 755 /app/reports

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000 9090

# Run with node directly (npm start adds overhead)
CMD ["node", "dist/index.js"]
