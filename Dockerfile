# Stage 1: Build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools in case native modules (like sqlite3) need compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Start the bot
CMD ["npm", "start"]
