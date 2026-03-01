# ============================================
# FactoryFlow — Multi-stage Production Dockerfile
# ============================================

# ── Stage 1: Build React frontend ───────────
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY public/ public/
COPY src/ src/

RUN npm run build

# ── Stage 2: Production API server ──────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies for the server
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --production

# Copy server source
COPY server/ ./server/

# Copy built React app from stage 1
COPY --from=frontend-build /app/build ./build

# Create logs directory
RUN mkdir -p server/logs

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the API port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5001/api/health || exit 1

ENV NODE_ENV=production

WORKDIR /app/server
CMD ["node", "index.js"]
