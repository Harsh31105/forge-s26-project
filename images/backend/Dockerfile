# Build stage: compile and build the application
FROM node:25-alpine3.22 AS builder 

# Set temporary working directory for build
WORKDIR /app/tmp 

# Copy all source files into the container

COPY package.json ./
# Install all dependencies (including devDependencies)
RUN npm install 

COPY . .
# Build the API package
# 'true &&' ensures build continues even if previous commands have non-zero exit codes
RUN npm run build

# Runtime stage: create minimal production image
FROM node:25-alpine3.22 as web

# Configure application port
ENV PORT=8080 
# Set Node environment to development
ENV NODE_ENV=dev

# Set working directory for application execution
WORKDIR /app/executor 

# Copy built artifacts from builder stage with proper ownership
COPY --from=builder /app/tmp /app/executor 

# Expose port for external access
EXPOSE $PORT

CMD ["npm", "run", "dev"]