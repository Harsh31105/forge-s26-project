# Use Node.js 25 on Alpine Linux for minimal image size
FROM node:25-alpine3.22 AS builder 

# Set working directory
WORKDIR /app

# Copy package.json first to leverage Docker layer caching
COPY package.json ./

# Install dependencies
RUN npm install 

COPY . .
# Build the production-ready frontend bundle
RUN npm run build 

# Expose frontend port
EXPOSE 3000

# Serve the built static files using serve package
CMD ["npx", "serve", "-s", "build"]
