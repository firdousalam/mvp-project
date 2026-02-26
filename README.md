# Product Order System MVP

A microservices-based application for managing users, products, and orders. Built with Node.js, MongoDB, Docker, and Kubernetes.

> **🎯 First time here?** Start with [START-HERE.md](./START-HERE.md) for a quick 3-step setup!

## Architecture Overview

The system consists of three independent microservices that communicate via REST APIs:

```
┌─────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                    │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  │ User Service │      │Product Service│     │Order Service │
│  │   Port 3001  │      │   Port 3002   │     │  Port 3003   │
│  │              │      │               │     │              │
│  │  ┌────────┐  │      │  ┌────────┐   │     │  ┌────────┐  │
│  │  │Express │  │      │  │Express │   │     │  │Express │  │
│  │  │  API   │  │      │  │  API   │   │     │  │  API   │  │
│  │  └────────┘  │      │  └────────┘   │     │  └────────┘  │
│  │      │       │      │      │        │     │      │       │
│  │      ▼       │      │      ▼        │     │      ▼       │
│  │  ┌────────┐  │      │  ┌────────┐   │     │  ┌────────┐  │
│  │  │MongoDB │  │      │  │MongoDB │   │     │  │MongoDB │  │
│  │  │ userdb │  │      │  │productdb│  │     │  │orderdb │  │
│  │  └────────┘  │      │  └────────┘   │     │  └────────┘  │
│  └──────────────┘      └──────────────┘      └──────────────┘
│         ▲                      ▲                     ▲        │
│         │                      │                     │        │
│         └──────────────────────┴─────────────────────┘        │
│                    REST API Communication                     │
└─────────────────────────────────────────────────────────────┘
```

## Services

### User Service (Port 3001)
- User registration and authentication
- User profile management (CRUD operations)
- Database: MongoDB (userdb)

**Key Endpoints:**
- `POST /users` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user
- `GET /health` - Health check

### Product Service (Port 3002)
- Product catalog management (CRUD operations)
- Product validation and retrieval
- Database: MongoDB (productdb)

**Key Endpoints:**
- `POST /products` - Create product
- `GET /products/:id` - Get product by ID
- `GET /products` - List all products
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /health` - Health check

### Order Service (Port 3003)
- Order creation and management
- Order status tracking
- Integration with User and Product services
- Database: MongoDB (orderdb)

**Key Endpoints:**
- `POST /orders` - Create order
- `GET /orders/:id` - Get order by ID
- `GET /orders/user/:userId` - List orders by user
- `PUT /orders/:id/status` - Update order status
- `GET /health` - Health check

### API Gateway (Port 8080) 🆕
- Unified entry point for all services
- Request routing and load balancing
- CORS support and error handling
- Centralized logging
- **JWT Authentication** (optional, configurable)
- **Rate Limiting** (prevents abuse)
- **Request Caching** (improves performance)
- **Security Headers** (Helmet.js)

**Features:**
- General rate limit: 100 requests per 15 minutes
- Auth rate limit: 5 login attempts per 15 minutes
- Write operations: 50 requests per 15 minutes
- Read operations: 200 requests per 15 minutes
- Response caching: 5-10 minutes (configurable)

**Access all services through:**
- `http://localhost:8080/users` → User Service
- `http://localhost:8080/products` → Product Service
- `http://localhost:8080/orders` → Order Service

**Admin endpoints:**
- `GET /admin/cache/stats` - View cache statistics
- `POST /admin/cache/clear` - Clear cache

**Configuration:**
```bash
# Enable/disable authentication
AUTH_ENABLED=true  # or false

# Set JWT secret
JWT_SECRET=your-secret-key

# Configure in docker-compose.yml
```

See [API-GATEWAY-GUIDE.md](./API-GATEWAY-GUIDE.md) for details.

## Project Structure

```
product-order-system/
├── user-service/          # User management microservice
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── product-service/       # Product catalog microservice
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── order-service/         # Order processing microservice
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── k8s/                   # Kubernetes manifests
│   ├── *-deployment.yaml
│   ├── *-service.yaml
│   ├── configmap.yaml
│   └── secret.yaml
├── docker-compose.yml     # Local development setup
├── package.json           # Root package with shared scripts
└── README.md             # This file
```

## 🚀 Quick Start

**Want to get started immediately?** See [QUICKSTART.md](./QUICKSTART.md) for step-by-step instructions!

### Three Ways to Run:
1. **Docker Compose** (Recommended): Run `npm run docker:up` - easiest and most reliable
2. **Automated Scripts** (Windows): Run `start-local.ps1` - for local development
3. **Manual Setup**: Follow detailed instructions below

### 🐳 Quick Start with Docker (Recommended)

**Prerequisites:** Docker Desktop installed and running

```bash
# 1. Build all services
npm run docker:build

# 2. Start everything
npm run docker:up

# 3. Test the system
# Open test-api-gateway.html in your browser
# Or visit: http://localhost:8080
```

**That's it!** All services are running:
- API Gateway: http://localhost:8080
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003

See [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) for complete Docker documentation.

### Interactive Testing
Open `test-api-gateway.html` in your browser for a visual API testing dashboard!

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB installed (for local development)
- Docker and Docker Compose installed (optional)
- Kubernetes cluster (for production deployment)
- kubectl configured (for Kubernetes deployment)

### Local Development with Docker Compose (Recommended)

**Prerequisites:** Docker Desktop installed and running

1. **Build all services**
   ```bash
   npm run docker:build
   ```

2. **Start all services**
   ```bash
   npm run docker:up
   ```

   This will start:
   - API Gateway on http://localhost:8080 (unified entry point)
   - User Service on http://localhost:3001
   - Product Service on http://localhost:3002
   - Order Service on http://localhost:3003
   - MongoDB instances for each service

3. **View logs**
   ```bash
   npm run docker:logs
   ```

4. **Stop all services**
   ```bash
   npm run docker:down
   ```

**Access the system:**
- Through API Gateway: http://localhost:8080/users, /products, /orders
- Test Dashboard: Open `test-api-gateway.html` in your browser
- Direct service access also available on ports 3001-3003

See [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) for detailed Docker documentation.

---

### Local Development without Docker

1. **Install dependencies for each service**
   ```bash
   cd user-service && npm install && cd ..
   cd product-service && npm install && cd ..
   cd order-service && npm install && cd ..
   ```

2. **Start MongoDB instances** (requires MongoDB installed locally)
   ```bash
   # Terminal 1
   mongod --port 27017 --dbpath ./data/userdb
   
   # Terminal 2
   mongod --port 27018 --dbpath ./data/productdb
   
   # Terminal 3
   mongod --port 27019 --dbpath ./data/orderdb
   ```

3. **Start services in development mode**
   ```bash
   # Terminal 4
   npm run dev:user
   
   # Terminal 5
   npm run dev:product
   
   # Terminal 6
   npm run dev:order
   ```

### Kubernetes Deployment

1. **Build Docker images**
   ```bash
   docker build -t user-service:latest ./user-service
   docker build -t product-service:latest ./product-service
   docker build -t order-service:latest ./order-service
   ```

2. **Apply Kubernetes manifests**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods
   kubectl get services
   ```

4. **Access services**
   ```bash
   # Port forward to access services locally
   kubectl port-forward service/user-service 3001:3001
   kubectl port-forward service/product-service 3002:3002
   kubectl port-forward service/order-service 3003:3003
   ```

## Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests for specific service
```bash
cd user-service && npm test
cd product-service && npm test
cd order-service && npm test
```

## Configuration

Services are configured via environment variables:

### User Service
- `PORT` - Service port (default: 3001)
- `MONGO_URI` - MongoDB connection string (default: mongodb://localhost:27017/userdb)

### Product Service
- `PORT` - Service port (default: 3002)
- `MONGO_URI` - MongoDB connection string (default: mongodb://localhost:27018/productdb)

### Order Service
- `PORT` - Service port (default: 3003)
- `MONGO_URI` - MongoDB connection string (default: mongodb://localhost:27019/orderdb)
- `USER_SERVICE_URL` - User service URL (default: http://localhost:3001)
- `PRODUCT_SERVICE_URL` - Product service URL (default: http://localhost:3002)

## Key Design Patterns

- **Database Per Service**: Each microservice has its own MongoDB database for loose coupling
- **Synchronous REST Communication**: Services communicate via HTTP REST APIs
- **API Gateway Pattern**: Single entry point with routing, auth, rate limiting, and caching
- **Health Checks**: All services expose `/health` endpoints for monitoring
- **Exponential Backoff**: Database connection retries with exponential backoff
- **Structured Logging**: JSON-formatted logs for machine readability
- **Configuration via Environment**: Externalized configuration for different environments
- **JWT Authentication**: Token-based authentication (optional, configurable)
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Response Caching**: Improve performance with intelligent caching

## Features

### Core Features
✅ User registration and authentication
✅ Product catalog management
✅ Order processing with validation
✅ Inter-service communication
✅ Health monitoring
✅ Structured logging
✅ Error handling

### API Gateway Features
✅ Unified entry point (single URL for all services)
✅ Request routing and proxying
✅ JWT authentication (optional)
✅ Rate limiting (configurable per endpoint)
✅ Response caching (improves performance)
✅ CORS support
✅ Security headers (Helmet.js)
✅ Request/response logging
✅ Cache management (stats and clearing)

### Infrastructure Features
✅ Docker containerization
✅ Docker Compose orchestration
✅ Kubernetes deployment manifests
✅ Nginx Ingress configuration
✅ MongoDB data persistence
✅ Environment-based configuration
✅ Health check endpoints
✅ Graceful shutdown

### Testing Features
✅ Unit tests (Jest)
✅ Property-based tests (fast-check)
✅ Integration tests
✅ 97+ tests passing
✅ Interactive web dashboard for API testing

## API Documentation

Detailed API documentation for each service:
- [User Service API](./user-service/API.md)
- [Product Service API](./product-service/API.md)
- [Order Service API](./order-service/API.md)

## License

ISC
