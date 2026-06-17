# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies for build tools)
RUN npm install

# Copy full application source
COPY . .

# Build Vite frontend and esbuild Compiled node backend
RUN npm run build

# Production runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files for dependency references
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled build directory from builder
COPY --from=builder /app/dist ./dist

# Expose server ingress port
EXPOSE 3000

# Run full-stack engine
CMD ["npm", "run", "start"]
