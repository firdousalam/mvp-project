# 🌐 API Gateway Implementation Guide

## Overview

The API Gateway provides a unified entry point for all microservices in the Product Order System. Instead of accessing each service on different ports, clients can access everything through a single URL.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          Client                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                    (Port 8080)                               │
│                                                              │
│  Routes:                                                     │
│  /users/*    → User Service (3001)                          │
│  /auth/*     → User Service (3001)                          │
│  /products/* → Product Service (3002)                       │
│  /orders/*   → Order Service (3003)                         │
└──────────────────────────┬───────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│User Service  │  │Product Service│  │Order Service │
│  Port 3001   │  │  Port 3002    │  │  Port 3003   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Benefits

### 1. **Single Entry Point**
- Clients only need to know one URL: `http://localhost:8080`
- Simplifies client configuration
- Easier to manage and document

### 2. **Centralized Management**
- Logging in one place
- CORS configuration in one place
- Authentication/authorization in one place (future)
- Rate limiting in one place (future)

### 3. **Service Abstraction**
- Clients don't need to know about individual service ports
- Services can be moved/scaled without affecting clients
- Easier to implement service discovery

### 4. **Enhanced Security**
- Single point for security policies
- Can add authentication middleware
- Can implement rate limiting
- Can validate requests before forwarding

## Setup Instructions

### Local Development

#### Step 1: Install Dependencies

```bash
cd api-gateway
npm install
```

#### Step 2: Start the Gateway

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The gateway will start on port 8080.

#### Step 3: Start Backend Services

Make sure all backend services are running:
- User Service on port 3001
- Product Service on port 3002
- Order Service on port 3003

Or use the automated script:
```bash
npm run start:local
```

### Docker Deployment

The API Gateway is included in docker-compose.yml:

```bash
# Start everything including gateway
npm run docker:up

# Gateway will be available at http://localhost:8080
```

### Kubernetes Deployment

Use the Nginx Ingress Controller for Kubernetes:

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Deploy the ingress
kubectl apply -f k8s/ingress.yaml

# Access through ingress
curl http://localhost/users
curl http://localhost/products
curl http://localhost/orders
```

See [k8s/INGRESS-SETUP.md](./k8s/INGRESS-SETUP.md) for detailed Kubernetes instructions.

## Usage

### Before (Without Gateway)

```bash
# Different URLs for each service
curl http://localhost:3001/users
curl http://localhost:3002/products
curl http://localhost:3003/orders
```

### After (With Gateway)

```bash
# Single URL for all services
curl http://localhost:8080/users
curl http://localhost:8080/products
curl http://localhost:8080/orders
```

## API Routes

### Gateway Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Gateway information and available endpoints |
| GET | `/health` | Gateway health check |

### Service Routes (Proxied)

| Path Pattern | Target Service | Original Port |
|--------------|----------------|---------------|
| `/users/*` | User Service | 3001 |
| `/auth/*` | User Service | 3001 |
| `/products/*` | Product Service | 3002 |
| `/orders/*` | Order Service | 3003 |

### Health Check Routes

| Path | Description |
|------|-------------|
| `/health/user` | User Service health |
| `/health/product` | Product Service health |
| `/health/order` | Order Service health |

## Testing

### Method 1: Web Dashboard

Open `test-api-gateway.html` in your browser for an interactive testing interface.

### Method 2: Command Line

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

### Method 3: Update Existing Test Dashboard

Update `test-api.html` to use the gateway:

```javascript
const SERVICES = {
    user: 'http://localhost:8080',
    product: 'http://localhost:8080',
    order: 'http://localhost:8080'
};
```

## Configuration

### Environment Variables

```bash
PORT=8080                                    # Gateway port
USER_SERVICE_URL=http://localhost:3001      # User service URL
PRODUCT_SERVICE_URL=http://localhost:3002   # Product service URL
ORDER_SERVICE_URL=http://localhost:3003     # Order service URL
NODE_ENV=development                         # Environment
```

### Docker Compose Configuration

```yaml
api-gateway:
  build:
    context: ./api-gateway
  ports:
    - "8080:8080"
  environment:
    - PORT=8080
    - USER_SERVICE_URL=http://user-service:3001
    - PRODUCT_SERVICE_URL=http://product-service:3002
    - ORDER_SERVICE_URL=http://order-service:3003
  depends_on:
    - user-service
    - product-service
    - order-service
```

## Features

### Current Features

✅ Request routing to appropriate services
✅ CORS support
✅ Request/response logging
✅ Error handling
✅ Health checks
✅ Service unavailability handling

### Future Enhancements

🔜 Authentication middleware (JWT validation)
🔜 Rate limiting
🔜 Request caching
🔜 Request validation
🔜 Circuit breaker pattern
🔜 Service discovery
🔜 Load balancing
🔜 API versioning
🔜 Request/response transformation
🔜 Analytics and monitoring

## Troubleshooting

### Gateway Won't Start

**Problem:** Port 8080 already in use

**Solution:**
```bash
# Check what's using port 8080
netstat -ano | findstr "8080"

# Change port in environment
set PORT=8081
npm start
```

### Services Not Reachable

**Problem:** Gateway returns 503 Service Unavailable

**Solution:**
1. Verify backend services are running:
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   ```

2. Check service URLs in gateway logs

3. Verify network connectivity

### CORS Errors

**Problem:** Browser shows CORS errors

**Solution:**
- Gateway has CORS enabled by default
- Check browser console for specific errors
- Verify request headers and methods

### Request Timeout

**Problem:** Requests take too long or timeout

**Solution:**
1. Check backend service performance
2. Increase timeout in gateway configuration
3. Check network latency

## Monitoring

### Gateway Logs

The gateway logs all requests:

```
[API Gateway] GET /users -> User Service
[API Gateway] User Service responded with status 200
```

### Health Monitoring

```bash
# Check gateway health
curl http://localhost:8080/health

# Response:
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "upstreamServices": {
    "userService": "http://localhost:3001",
    "productService": "http://localhost:3002",
    "orderService": "http://localhost:3003"
  }
}
```

## Comparison: Local Gateway vs Kubernetes Ingress

| Feature | Local Gateway (Node.js) | Kubernetes Ingress (Nginx) |
|---------|------------------------|----------------------------|
| **Use Case** | Local development | Production deployment |
| **Port** | 8080 | 80/443 |
| **Technology** | Express + http-proxy-middleware | Nginx Ingress Controller |
| **Setup** | `npm start` | `kubectl apply -f ingress.yaml` |
| **Customization** | Easy (JavaScript) | Annotations |
| **Performance** | Good for dev | Optimized for production |
| **Features** | Basic routing, CORS, logging | Advanced routing, TLS, rate limiting |

## Production Considerations

When deploying to production:

1. **Use Kubernetes Ingress** instead of Node.js gateway
2. **Enable HTTPS/TLS** with valid certificates
3. **Add authentication** (JWT, OAuth)
4. **Implement rate limiting** to prevent abuse
5. **Add monitoring** (Prometheus, Grafana)
6. **Enable request logging** to centralized system
7. **Use CDN** for static content
8. **Implement circuit breakers** for resilience
9. **Add request/response size limits**
10. **Use service mesh** (Istio, Linkerd) for advanced features

## Files Created

- `api-gateway/index.js` - Gateway implementation
- `api-gateway/package.json` - Dependencies
- `api-gateway/Dockerfile` - Docker configuration
- `api-gateway/README.md` - Gateway documentation
- `k8s/ingress.yaml` - Kubernetes Ingress configuration
- `k8s/INGRESS-SETUP.md` - Kubernetes setup guide
- `test-api-gateway.html` - Testing dashboard
- `API-GATEWAY-GUIDE.md` - This guide

## Quick Start Commands

```bash
# Install gateway dependencies
cd api-gateway && npm install && cd ..

# Start everything (including gateway)
npm run start:local

# Or with Docker
npm run docker:up

# Test the gateway
curl http://localhost:8080/health

# Open test dashboard
# Open test-api-gateway.html in browser
```

## Next Steps

1. ✅ Start the gateway
2. ✅ Test with the web dashboard
3. ✅ Update your client applications to use gateway URL
4. 🔜 Add authentication middleware
5. 🔜 Implement rate limiting
6. 🔜 Deploy to Kubernetes with Ingress

---

**The API Gateway is now ready to use! All services are accessible through http://localhost:8080** 🚀
