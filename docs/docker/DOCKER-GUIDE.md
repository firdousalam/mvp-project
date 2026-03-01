# 🐳 Docker Deployment Guide

Complete guide for running the Product Order System with Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)
- At least 4GB RAM available for Docker
- 10GB free disk space

### Install Docker Desktop

**Windows/Mac:**
1. Download from: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Start Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

## Quick Start (3 Commands)

```bash
# 1. Build all images
npm run docker:build

# 2. Start all services
npm run docker:up

# 3. Open test dashboard
# Open test-api-gateway.html in your browser
```

That's it! All services are now running.

---

## Architecture

When you run `docker-compose up`, the following containers are created:

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │   MongoDB    │  │   MongoDB    │      │
│  │   User DB    │  │  Product DB  │  │   Order DB   │      │
│  │  Port 27017  │  │  Port 27017  │  │  Port 27017  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │User Service  │  │Product Service│  │Order Service │      │
│  │  Port 3001   │  │  Port 3002    │  │  Port 3003   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼───────┐                         │
│                    │ API Gateway  │                         │
│                    │  Port 8080   │                         │
│                    └──────────────┘                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Host    │
                    │ localhost │
                    └───────────┘
```

**Exposed Ports:**
- `8080` - API Gateway (unified entry point)
- `3001` - User Service (direct access)
- `3002` - Product Service (direct access)
- `3003` - Order Service (direct access)
- `27017` - MongoDB User DB
- `27018` - MongoDB Product DB
- `27019` - MongoDB Order DB

---

## Detailed Commands

### Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build user-service
docker-compose build product-service
docker-compose build order-service
docker-compose build api-gateway

# Build without cache (clean build)
docker-compose build --no-cache
```

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start all services with logs in foreground
docker-compose up

# Start specific services
docker-compose up -d user-service product-service

# Start and rebuild if needed
docker-compose up -d --build
```

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs user-service
docker-compose logs api-gateway

# Follow logs for specific service
docker-compose logs -f order-service

# View last 100 lines
docker-compose logs --tail=100
```

### Stop Services

```bash
# Stop all services (keeps containers)
docker-compose stop

# Stop specific service
docker-compose stop user-service

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes (deletes data!)
docker-compose down -v

# Stop, remove everything including images
docker-compose down --rmi all -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api-gateway
```

### Check Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats

# Check specific container
docker inspect product-order-system_user-service_1
```

---

## Service URLs

Once running, access services at:

### Through API Gateway (Recommended)
- **Gateway:** http://localhost:8080
- **Users:** http://localhost:8080/users
- **Products:** http://localhost:8080/products
- **Orders:** http://localhost:8080/orders
- **Health:** http://localhost:8080/health

### Direct Service Access
- **User Service:** http://localhost:3001
- **Product Service:** http://localhost:3002
- **Order Service:** http://localhost:3003

### Database Access
- **User DB:** mongodb://localhost:27017/userdb
- **Product DB:** mongodb://localhost:27018/productdb
- **Order DB:** mongodb://localhost:27019/orderdb

---

## Testing

### Method 1: Web Dashboard

Open `test-api-gateway.html` in your browser for interactive testing.

### Method 2: curl Commands

```bash
# Check gateway health
curl http://localhost:8080/health

# Create a user
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Create a product
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"stock":10}'

# List products
curl http://localhost:8080/products

# Create an order
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","items":[{"productId":"PRODUCT_ID","quantity":2}]}'
```

---

## Configuration

### Environment Variables

Edit `docker-compose.yml` to configure services:

```yaml
environment:
  # API Gateway
  - PORT=8080
  - AUTH_ENABLED=false          # Set to true to enable authentication
  - JWT_SECRET=your-secret-key  # Change in production!
  - NODE_ENV=development
  
  # Service URLs (internal Docker network)
  - USER_SERVICE_URL=http://user-service:3001
  - PRODUCT_SERVICE_URL=http://product-service:3002
  - ORDER_SERVICE_URL=http://order-service:3003
  
  # Database connections
  - MONGO_URI=mongodb://mongodb-user:27017/userdb
```

### Enable Authentication

To enable JWT authentication in the API Gateway:

1. Edit `docker-compose.yml`:
   ```yaml
   api-gateway:
     environment:
       - AUTH_ENABLED=true
       - JWT_SECRET=your-very-secret-key-here
   ```

2. Restart the gateway:
   ```bash
   docker-compose restart api-gateway
   ```

3. Now all requests (except login and registration) require a JWT token:
   ```bash
   # Login to get token
   TOKEN=$(curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}' \
     | jq -r '.token')
   
   # Use token in requests
   curl http://localhost:8080/products \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Data Persistence

### Volumes

Docker Compose creates named volumes for data persistence:

```yaml
volumes:
  user-data:      # User database data
  product-data:   # Product database data
  order-data:     # Order database data
```

**Data persists between restarts** unless you explicitly remove volumes.

### Backup Data

```bash
# Backup user database
docker exec mongodb-user mongodump --out=/backup
docker cp mongodb-user:/backup ./backup-user

# Backup product database
docker exec mongodb-product mongodump --out=/backup
docker cp mongodb-product:/backup ./backup-product

# Backup order database
docker exec mongodb-order mongodump --out=/backup
docker cp mongodb-order:/backup ./backup-order
```

### Restore Data

```bash
# Restore user database
docker cp ./backup-user mongodb-user:/backup
docker exec mongodb-user mongorestore /backup

# Similar for other databases
```

### Reset Data

```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## Troubleshooting

### Services Won't Start

**Problem:** Containers exit immediately

**Solution:**
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs user-service

# Common issues:
# - Port already in use
# - MongoDB not ready
# - Build errors
```

### Port Already in Use

**Problem:** `Error: bind: address already in use`

**Solution:**
```bash
# Find what's using the port
netstat -ano | findstr "8080"

# Stop the process or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use different host port
```

### Cannot Connect to Services

**Problem:** `curl: (7) Failed to connect`

**Solution:**
```bash
# Check if containers are running
docker-compose ps

# Check if services are healthy
curl http://localhost:8080/health

# Wait 10-15 seconds for services to start
# MongoDB takes time to initialize
```

### Database Connection Errors

**Problem:** Services can't connect to MongoDB

**Solution:**
```bash
# Check MongoDB containers
docker-compose ps | grep mongodb

# Check MongoDB logs
docker-compose logs mongodb-user

# Restart MongoDB
docker-compose restart mongodb-user mongodb-product mongodb-order
```

### Out of Memory

**Problem:** Docker runs out of memory

**Solution:**
1. Open Docker Desktop Settings
2. Go to Resources
3. Increase Memory to at least 4GB
4. Click "Apply & Restart"

### Build Failures

**Problem:** `docker-compose build` fails

**Solution:**
```bash
# Clean build
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Check Dockerfile syntax
docker-compose config
```

---

## Advanced Usage

### Scale Services

```bash
# Run multiple instances of a service
docker-compose up -d --scale user-service=3

# Note: You'll need a load balancer for this to work properly
```

### Execute Commands in Containers

```bash
# Open shell in container
docker-compose exec user-service sh

# Run command in container
docker-compose exec user-service npm test

# Run as root
docker-compose exec --user root user-service sh
```

### View Container Details

```bash
# Inspect container
docker inspect api-gateway

# View environment variables
docker-compose exec api-gateway env

# View processes
docker-compose top
```

### Network Inspection

```bash
# List networks
docker network ls

# Inspect network
docker network inspect product-order-system_default

# Test connectivity between containers
docker-compose exec api-gateway ping user-service
```

---

## Production Considerations

### Security

1. **Change default secrets:**
   ```yaml
   environment:
     - JWT_SECRET=use-a-strong-random-secret-here
   ```

2. **Enable authentication:**
   ```yaml
   environment:
     - AUTH_ENABLED=true
   ```

3. **Use environment files:**
   ```bash
   # Create .env file
   JWT_SECRET=your-secret-key
   AUTH_ENABLED=true
   
   # Reference in docker-compose.yml
   env_file:
     - .env
   ```

4. **Don't expose database ports:**
   ```yaml
   # Remove these from docker-compose.yml
   ports:
     - "27017:27017"  # Remove for production
   ```

### Performance

1. **Resource limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
       reservations:
         cpus: '0.25'
         memory: 256M
   ```

2. **Health checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

### Monitoring

1. **View logs:**
   ```bash
   docker-compose logs -f --tail=100
   ```

2. **Monitor resources:**
   ```bash
   docker stats
   ```

3. **Use logging driver:**
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

---

## Quick Reference

### Common Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart a service
docker-compose restart api-gateway

# Rebuild and restart
docker-compose up -d --build

# Clean everything
docker-compose down -v --rmi all
```

### NPM Scripts

```bash
npm run docker:build   # Build all images
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
npm run docker:logs    # View logs
```

---

## Next Steps

1. ✅ Start services with `docker-compose up -d`
2. ✅ Test with `test-api-gateway.html`
3. ✅ Check logs with `docker-compose logs -f`
4. ✅ Monitor with `docker stats`
5. 🔜 Deploy to production (Kubernetes)

---

**Your Product Order System is now running in Docker!** 🐳🚀
