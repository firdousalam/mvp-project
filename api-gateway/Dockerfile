# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the gateway
CMD ["node", "index.js"]
