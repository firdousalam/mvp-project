# API Gateway

A simple API Gateway for the Product Order System that provides a unified entry point for all microservices.

## Features

- **Single Entry Point**: Access all services through one URL
- **Request Routing**: Automatically routes requests to the correct service
- **CORS Support**: Handles cross-origin requests
- **Error Handling**: Graceful error handling and service unavailability
- **Logging**: Request/response logging with Morgan
- **Health Checks**: Monitor gateway and individual service health

## Architecture

```
Client
   │
   ▼
API Gateway (Port 8080)
   │
   ├─► User Service (Port 3001)
   ├─► Product Service (Port 3002)
   └─► Order Service (Port 3003)
```

## Installation

```bash
cd api-gateway
npm install
```

## Running

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### With Docker:
```bash
docker build -t api-gateway .
docker run -p 8080:8080 \
  -e USER_SERVICE_URL=http://user-service:3001 \
  -e PRODUCT_SERVICE_URL=http://product-service:3002 \
  -e ORDER_SERVICE_URL=http://order-service:3003 \
  api-gateway
```

## Configuration

Configure service URLs via environment variables:

```bash
PORT=8080                                    # Gateway port (default: 8080)
USER_SERVICE_URL=http://localhost:3001      # User service URL
PRODUCT_SERVICE_URL=http://localhost:3002   # Product service URL
ORDER_SERVICE_URL=http://localhost:3003     # Order service URL
```

## API Routes

### Gateway Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Gateway information |
| GET | `/health` | Gateway health check |

### Service Routes

All requests are proxied to the appropriate service:

| Path Pattern | Target Service | Port |
|--------------|----------------|------|
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

## Usage Examples

### Using the Gateway

Instead of accessing services directly:
```bash
# Old way - direct service access
curl http://localhost:3001/users
curl http://localhost:3002/products
curl http://localhost:3003/orders
```

Use the gateway:
```bash
# New way - through API Gateway
curl http://localhost:8080/users
curl http://localhost:8080/products
curl http://localhost:8080/orders
```

### Create a User

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Product

```bash
curl -X POST http://localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "stock": 10
  }'
```

### Create an Order

```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "quantity": 2
      }
    ]
  }'
```

### Check Health

```bash
# Gateway health
curl http://localhost:8080/health

# Individual service health
curl http://localhost:8080/health/user
curl http://localhost:8080/health/product
curl http://localhost:8080/health/order
```

## Benefits

1. **Simplified Client Code**: Clients only need to know one URL
2. **Centralized Logging**: All requests logged in one place
3. **CORS Handling**: Configured once for all services
4. **Load Balancing**: Can add load balancing logic
5. **Authentication**: Can add centralized auth middleware
6. **Rate Limiting**: Can implement rate limiting at gateway level
7. **Request/Response Transformation**: Modify requests/responses if needed
8. **Service Discovery**: Abstract service locations from clients

## Error Handling

The gateway handles various error scenarios:

### Service Unavailable (503)
When a backend service is down:
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "User Service is currently unavailable",
    "details": "connect ECONNREFUSED 127.0.0.1:3001"
  }
}
```

### Not Found (404)
When endpoint doesn't exist:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Endpoint not found",
    "path": "/invalid",
    "availableEndpoints": ["/users", "/auth", "/products", "/orders", "/health"]
  }
}
```

## Monitoring

The gateway logs all requests:

```
[API Gateway] GET /users -> User Service
[API Gateway] User Service responded with status 200
```

## Advanced Features (Future Enhancements)

- **Authentication Middleware**: JWT validation at gateway level
- **Rate Limiting**: Prevent abuse with rate limits
- **Caching**: Cache responses for better performance
- **Request Validation**: Validate requests before forwarding
- **Circuit Breaker**: Prevent cascading failures
- **Service Discovery**: Dynamic service registration
- **Load Balancing**: Distribute load across service instances
- **API Versioning**: Support multiple API versions
- **Request Transformation**: Modify requests/responses
- **Analytics**: Track API usage and performance

## Troubleshooting

### Gateway won't start
- Check if port 8080 is available
- Verify Node.js is installed
- Check dependencies are installed (`npm install`)

### Services not reachable
- Verify backend services are running
- Check service URLs in environment variables
- Test services directly (bypass gateway)

### CORS errors
- Gateway has CORS enabled by default
- Check browser console for specific errors
- Verify request headers

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (Nginx, HAProxy) in front of the gateway
2. **Enable HTTPS/TLS** for secure communication
3. **Add authentication** and authorization
4. **Implement rate limiting** to prevent abuse
5. **Add monitoring** and alerting
6. **Use environment-specific configs**
7. **Enable request/response compression**
8. **Add request ID tracking** for debugging
9. **Implement circuit breakers** for resilience
10. **Use a service mesh** (Istio, Linkerd) for advanced features

## Testing

Test the gateway with the included test dashboard:

1. Update `test-api.html` to use gateway URL:
   ```javascript
   const SERVICES = {
       user: 'http://localhost:8080',
       product: 'http://localhost:8080',
       order: 'http://localhost:8080'
   };
   ```

2. Open `test-api.html` in your browser
3. Test all endpoints through the gateway

## License

ISC
