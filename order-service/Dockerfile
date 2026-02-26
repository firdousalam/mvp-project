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

# Expose port 3003
EXPOSE 3003

# Start the service
CMD ["node", "index.js"]
