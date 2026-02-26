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

# Expose port 3002
EXPOSE 3002

# Start the service
CMD ["node", "index.js"]
