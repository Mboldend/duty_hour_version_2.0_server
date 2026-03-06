# ------- Build stage -------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY tsconfig.json ./

# Install dependencies with yarn
RUN yarn install --frozen-lockfile

# Copy source code
COPY src ./src

# Build TypeScript to JavaScript
RUN yarn build

# Verify build was successful
RUN test -d dist || (echo "Build failed: dist directory not created" && exit 1)

# ------- Production stage -------
FROM node:20-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create upload directories
RUN mkdir -p uploads/docs uploads/image uploads/media

# Expose port
EXPOSE 9999

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get({host: '127.0.0.1', port: 9999, path: '/health'}, (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "dist/server.js"]