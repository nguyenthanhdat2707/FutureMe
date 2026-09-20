# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies, including the TypeScript toolchain required to compile
# the application in the builder stage.
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript and remove development-only packages before the runtime image.
RUN npm run build && \
    npm prune --production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create data directory with proper permissions
RUN mkdir -p ./data && chown -R nodejs:nodejs ./data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
