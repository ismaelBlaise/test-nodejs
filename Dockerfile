FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY . .

# Install dependencies with legacy peer deps to handle version conflicts
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY src ./src
COPY tsconfig.json .
COPY .env.example .env

# Build TypeScript
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000 9090

CMD ["npm", "start"]
