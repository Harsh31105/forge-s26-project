# Build stage: compile and build the application
FROM node:25-alpine3.22 AS builder 

# Set temporary working directory for build
WORKDIR /app/tmp 

# Copy all source files into the container
COPY . . 

# Install all dependencies (including devDependencies)
RUN npm install 

# Build the API package
# 'true &&' ensures build continues even if previous commands have non-zero exit codes
RUN true \ 
  && cd pkgs/api \
  && npm run dev:build

# Runtime stage: create minimal production image
FROM node:25-alpine3.22 as web

# Configure application port
ENV PORT=8080 
# Set Node environment to development
ENV NODE_ENV=dev

# Run as non-root user for security
USER node 

# Set working directory for application execution
WORKDIR /app/executor 

# Copy built artifacts from builder stage with proper ownership
COPY --from=builder --chown=node:node /app/tmp app/executor 

# Expose port for external access
EXPOSE 8080