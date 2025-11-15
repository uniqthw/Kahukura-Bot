# Multi-stage build for Kahukura Bot (Production)

# Stage 1: Build stage
FROM node:22-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files and TypeScript config
COPY . .

# Copy settings.example.json as settings.json for build (TypeScript needs it for compilation)
# The real settings.json will be mounted at runtime
RUN cp settings.example.json settings.json

# Build TypeScript to JavaScript
RUN pnpm run build

# Stage 2: Production stage
FROM node:22-alpine

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Create app user for security
RUN addgroup -g 1001 -S botuser && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G botuser -g botuser botuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/@types ./@types

# Change ownership to botuser
RUN chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Start the bot
CMD ["node", "dist/app.js"]