# Multi-stage Dockerfile for Personal AI Life OS

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the React frontend (Vite) and Node backend (esbuild)
RUN npm run build

# 2. Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install only production dependencies (Express, etc.)
RUN npm ci --only=production

# Copy built artifacts from builder stage (statically built dist directory and server.cjs)
COPY --from=builder /app/dist ./dist

# Expose the API and Web Server port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start Express server hosting both the client and API endpoints
CMD ["npm", "start"]
