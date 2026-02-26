# Design Document: Product Order System MVP

## Overview

The Product Order System MVP is a microservices architecture consisting of three independent services (User, Product, Order) that communicate via REST APIs. Each service is containerized with Docker, orchestrated with Kubernetes, and maintains its own MongoDB database following the database-per-service pattern. The system is organized as a monorepo for simplified development and deployment coordination.

### Key Design Decisions

1. **Monorepo Structure**: All services in a single repository for easier dependency management and coordinated releases during MVP phase
2. **Database Per Service**: Each service owns its data, ensuring loose coupling and independent scalability
3. **Synchronous REST Communication**: Simple HTTP-based communication for MVP; can evolve to async messaging later
4. **Node.js + Express**: Consistent technology stack across all services for team efficiency
5. **Docker + Kubernetes**: Industry-standard containerization and orchestration for cloud-native deployment

## Architecture

### System Architecture Diagram

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

### Service Responsibilities

**User Service (Port 3001)**:
- User registration and authentication
- User profile management (CRUD operations)
- User data validation
- User existence verification for other services

**Product Service (Port 3002)**:
- Product catalog management (CRUD operations)
- Product data validation
- Product existence verification and details retrieval for other services

**Order Service (Port 3003)**:
- Order creation and management
- Order status tracking
- Integration with User Service for user validation
- Integration with Product Service for product validation and details
- Order history retrieval by user

### Communication Patterns

**Inter-Service Communication**:
- Order Service → User Service: GET /users/:id (validate user exists)
- Order Service → Product Service: GET /products/:id (validate product and get details)
- All communication uses HTTP/REST with JSON payloads
- Services use Kubernetes internal DNS for service discovery (e.g., http://user-service:3001)

**External Communication**:
- Clients interact with services directly via Kubernetes Services (MVP)
- Future: Nginx Ingress or API Gateway for unified entry point

## Components and Interfaces

### User Service

**API Endpoints**:

```
POST   /users              - Create new user
GET    /users/:id          - Get user by ID
PUT    /users/:id          - Update user profile
DELETE /users/:id          - Delete user
POST   /auth/login         - Authenticate user
GET    /health             - Health check
```

**Request/Response Models**:

```javascript
// POST /users - Request
{
  "email": "string (required, valid email format)",
  "password": "string (required, min 8 characters)",
  "name": "string (required)"
}

// POST /users - Response (201)
{
  "id": "string (MongoDB ObjectId)",
  "email": "string",
  "name": "string",
  "createdAt": "ISO 8601 timestamp"
}

// GET /users/:id - Response (200)
{
  "id": "string",
  "email": "string",
  "name": "string",
  "createdAt": "ISO 8601 timestamp"
}

// POST /auth/login - Request
{
  "email": "string (required)",
  "password": "string (required)"
}

// POST /auth/login - Response (200)
{
  "token": "string (JWT)",
  "userId": "string"
}
```

**Database Schema**:

```javascript
// users collection
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Service

**API Endpoints**:

```
POST   /products           - Create new product
GET    /products/:id       - Get product by ID
GET    /products           - List all products
PUT    /products/:id       - Update product
DELETE /products/:id       - Delete product
GET    /health             - Health check
```

**Request/Response Models**:

```javascript
// POST /products - Request
{
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required, positive)",
  "stock": "number (required, non-negative integer)"
}

// POST /products - Response (201)
{
  "id": "string (MongoDB ObjectId)",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "createdAt": "ISO 8601 timestamp"
}

// GET /products - Response (200)
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "number",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

**Database Schema**:

```javascript
// products collection
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  stock: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Service

**API Endpoints**:

```
POST   /orders             - Create new order
GET    /orders/:id         - Get order by ID
GET    /orders/user/:userId - List orders by user
PUT    /orders/:id/status  - Update order status
GET    /health             - Health check
```

**Request/Response Models**:

```javascript
// POST /orders - Request
{
  "userId": "string (required, MongoDB ObjectId)",
  "items": [
    {
      "productId": "string (required, MongoDB ObjectId)",
      "quantity": "number (required, positive integer)"
    }
  ]
}

// POST /orders - Response (201)
{
  "id": "string (MongoDB ObjectId)",
  "userId": "string",
  "items": [
    {
      "productId": "string",
      "productName": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "totalAmount": "number",
  "status": "string (pending)",
  "createdAt": "ISO 8601 timestamp"
}

// PUT /orders/:id/status - Request
{
  "status": "string (pending|processing|completed|cancelled)"
}
```

**Database Schema**:

```javascript
// orders collection
{
  _id: ObjectId,
  userId: String,
  items: [
    {
      productId: String,
      productName: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  status: String (enum: pending, processing, completed, cancelled),
  createdAt: Date,
  updatedAt: Date
}
```

### HTTP Client Module

Each service that makes inter-service calls will use a shared HTTP client pattern:

```javascript
// httpClient.js
class ServiceClient {
  constructor(baseURL, timeout = 5000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  async get(path) {
    // HTTP GET with timeout and error handling
  }

  async post(path, data) {
    // HTTP POST with timeout and error handling
  }
}
```

## Data Models

### User Model

```javascript
class User {
  constructor(email, password, name) {
    this.email = email;
    this.password = password; // Will be hashed before storage
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  validate() {
    // Email format validation
    // Password strength validation (min 8 chars)
    // Name presence validation
  }
}
```

### Product Model

```javascript
class Product {
  constructor(name, description, price, stock) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  validate() {
    // Name presence validation
    // Price positive validation
    // Stock non-negative integer validation
  }
}
```

### Order Model

```javascript
class Order {
  constructor(userId, items) {
    this.userId = userId;
    this.items = items; // Array of {productId, productName, price, quantity}
    this.totalAmount = this.calculateTotal();
    this.status = 'pending';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  validate() {
    // UserId presence validation
    // Items array non-empty validation
    // Each item has required fields validation
    // Quantities are positive integers validation
  }
}
```

### Validation Rules

**User Validation**:
- Email: Must match email regex pattern
- Password: Minimum 8 characters
- Name: Non-empty string

**Product Validation**:
- Name: Non-empty string
- Price: Positive number
- Stock: Non-negative integer

**Order Validation**:
- UserId: Valid MongoDB ObjectId format
- Items: Non-empty array
- Each item: Valid productId, positive quantity


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: User data persistence round trip
*For any* valid user data, after storing it in the User Service database, retrieving it by ID should return equivalent user data with all fields preserved.
**Validates: Requirements 2.5**

### Property 2: Product data persistence round trip
*For any* valid product data, after storing it in the Product Service database, retrieving it by ID should return equivalent product data with all fields preserved.
**Validates: Requirements 3.6**

### Property 3: Order data persistence round trip
*For any* valid order data, after storing it in the Order Service database, retrieving it by ID should return equivalent order data with all fields preserved.
**Validates: Requirements 4.5**

### Property 4: Valid user registration succeeds
*For any* valid user registration data (valid email format, password ≥8 chars, non-empty name), the User Service should successfully create a user record and return a response with an assigned ID.
**Validates: Requirements 2.7**

### Property 5: Valid product creation succeeds
*For any* valid product data (non-empty name, positive price, non-negative stock), the Product Service should successfully create a product record and return the product with an assigned ID.
**Validates: Requirements 3.8**

### Property 6: Authentication with valid credentials returns token
*For any* registered user, authenticating with the correct email and password should return an authentication token.
**Validates: Requirements 2.8**

### Property 7: Duplicate email registration fails
*For any* email that already exists in the User Service database, attempting to register a new user with that email should fail with an error response.
**Validates: Requirements 2.9**

### Property 8: Non-existent product retrieval returns 404
*For any* product ID that does not exist in the Product Service database, attempting to retrieve that product should return a 404 error response.
**Validates: Requirements 3.9**

### Property 9: Order creation validates user existence
*For any* order creation request, the Order Service should make an HTTP request to the User Service to validate the userId before creating the order.
**Validates: Requirements 4.7, 6.1**

### Property 10: Order creation validates and retrieves product details
*For any* order creation request, the Order Service should make HTTP requests to the Product Service for each productId to validate existence and retrieve product details.
**Validates: Requirements 4.8, 6.2**

### Property 11: Successfully created orders have pending status
*For any* order that is successfully created, the order should be stored with status "pending" and the response should include this status.
**Validates: Requirements 4.9**

### Property 12: Invalid user ID rejects order creation
*For any* order creation request with a userId that does not exist in User Service, the Order Service should reject the order with an error response.
**Validates: Requirements 4.10**

### Property 13: Invalid product ID rejects order creation
*For any* order creation request containing a productId that does not exist in Product Service, the Order Service should reject the order with an error response.
**Validates: Requirements 4.11**

### Property 14: Services wait for database connection before accepting requests
*For any* service startup, the service should not respond to API requests until the database connection is successfully established.
**Validates: Requirements 5.4**

### Property 15: Database connection failures trigger exponential backoff retry
*For any* database connection failure during startup, the service should retry the connection with exponentially increasing delays between attempts.
**Validates: Requirements 5.5**

### Property 16: Failed inter-service calls return error responses
*For any* inter-service REST call that fails (timeout, connection error, or error response), the calling service should return an appropriate error response to the client rather than crashing.
**Validates: Requirements 6.4, 6.5**

### Property 17: Configuration loaded from environment variables
*For any* configuration value (database connection string, service port, inter-service URL) provided via environment variable, the service should use that value instead of hardcoded defaults.
**Validates: Requirements 7.5, 11.1, 11.2, 11.3**

### Property 18: Health check verifies database connectivity
*For any* service, when the /health endpoint is called and the database is connected, the endpoint should return a healthy status; when the database is disconnected, it should return 503 status code.
**Validates: Requirements 9.4, 9.5**

### Property 19: Error logging includes required metadata
*For any* error encountered by a service, the error log entry should contain timestamp, service name, and error details.
**Validates: Requirements 10.1**

### Property 20: Invalid requests return 400 with error message
*For any* invalid request (missing required fields, invalid data types, failed validation), the service should return a 400 status code with a descriptive error message.
**Validates: Requirements 10.2**

### Property 21: Internal errors return 500 status code
*For any* internal error (database errors, unexpected exceptions), the service should return a 500 status code with a generic error message.
**Validates: Requirements 10.3**

### Property 22: Request logging includes method, path, and status
*For any* incoming HTTP request, the service should create a log entry containing the HTTP method, request path, and response status code.
**Validates: Requirements 10.4**

### Property 23: Logs use structured format
*For any* log entry created by a service, the log should be in structured JSON format that can be parsed by log aggregation tools.
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

**Validation Errors (400)**:
- Missing required fields
- Invalid data types
- Failed business validation (e.g., negative price, invalid email format)
- Response includes specific validation error messages

**Not Found Errors (404)**:
- Resource does not exist (user, product, order)
- Response includes resource type and ID

**Service Unavailable Errors (503)**:
- Database connection failures
- Health check failures
- Response includes generic error message

**Internal Server Errors (500)**:
- Unexpected exceptions
- Unhandled errors
- Response includes generic error message (no internal details exposed)

**Inter-Service Communication Errors**:
- Timeout errors: Return 503 to client
- Connection errors: Return 503 to client
- Upstream service errors: Propagate appropriate status code

### Error Response Format

All error responses follow a consistent structure:

```javascript
{
  "error": {
    "code": "string (ERROR_CODE)",
    "message": "string (human-readable message)",
    "details": "object (optional, validation details)"
  }
}
```

### Retry Strategy

**Database Connection Retries**:
- Initial retry delay: 1 second
- Maximum retry delay: 30 seconds
- Backoff multiplier: 2x
- Maximum retry attempts: 10

**Inter-Service Call Retries**:
- No automatic retries in MVP (fail fast)
- Timeout: 5 seconds per request
- Future: Implement retry with circuit breaker pattern

## Testing Strategy

### Dual Testing Approach

This system requires both unit testing and property-based testing to ensure comprehensive correctness:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific example requests and responses
- Edge cases (empty strings, boundary values, special characters)
- Error conditions (missing fields, invalid formats)
- Integration points between components

**Property Tests**: Verify universal properties across all inputs
- Data persistence round trips
- Validation rules across all possible inputs
- Error handling consistency
- Configuration loading behavior

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs with specific examples, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for Node.js property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: product-order-system, Property {number}: {property_text}`
- Each correctness property must be implemented by a single property-based test

**Example Property Test Structure**:

```javascript
const fc = require('fast-check');

// Feature: product-order-system, Property 1: User data persistence round trip
test('user data persistence round trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        name: fc.string({ minLength: 1 })
      }),
      async (userData) => {
        // Store user
        const created = await userService.createUser(userData);
        // Retrieve user
        const retrieved = await userService.getUserById(created.id);
        // Assert equivalence
        expect(retrieved.email).toBe(userData.email);
        expect(retrieved.name).toBe(userData.name);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Testing Scope

**User Service Tests**:
- Property tests for data persistence, validation, duplicate detection
- Unit tests for authentication flow, password hashing
- Integration tests for database operations

**Product Service Tests**:
- Property tests for data persistence, validation, error handling
- Unit tests for CRUD operations
- Integration tests for database operations

**Order Service Tests**:
- Property tests for order creation, inter-service communication, error handling
- Unit tests for total calculation, status transitions
- Integration tests for multi-service workflows

**Infrastructure Tests**:
- Docker image build verification
- Kubernetes manifest validation (YAML syntax)
- Health endpoint functionality

### Test Environment

**Local Development**:
- Use docker-compose to spin up services and databases
- Run tests against containerized services
- Use test databases that are reset between test runs

**CI/CD Pipeline**:
- Run unit tests and property tests on every commit
- Build Docker images and verify successful builds
- Validate Kubernetes manifests with kubectl dry-run

## Deployment Architecture

### Local Development (docker-compose)

```yaml
# docker-compose.yml structure
services:
  user-service:
    - Port mapping: 3001:3001
    - Environment: MONGO_URI, PORT
    - Depends on: mongodb-user
  
  product-service:
    - Port mapping: 3002:3002
    - Environment: MONGO_URI, PORT
    - Depends on: mongodb-product
  
  order-service:
    - Port mapping: 3003:3003
    - Environment: MONGO_URI, PORT, USER_SERVICE_URL, PRODUCT_SERVICE_URL
    - Depends on: mongodb-order
  
  mongodb-user:
    - Port mapping: 27017:27017
    - Volume: user-data
  
  mongodb-product:
    - Port mapping: 27018:27017
    - Volume: product-data
  
  mongodb-order:
    - Port mapping: 27019:27017
    - Volume: order-data
```

### Kubernetes Deployment

**Resource Organization**:
- Separate namespace: product-order-system
- Deployment per service (user-service, product-service, order-service)
- StatefulSet per database (mongodb-user, mongodb-product, mongodb-order)
- Service per component for internal networking
- ConfigMap for non-sensitive config
- Secret for database credentials
- PersistentVolumeClaim per database for data persistence

**Resource Limits** (per service):
- CPU: 100m request, 500m limit
- Memory: 128Mi request, 512Mi limit

**Health Probes**:
- Liveness probe: GET /health every 10s
- Readiness probe: GET /health every 5s
- Initial delay: 10s for services, 30s for databases

## Implementation Notes

### Service Independence

Each service should be independently deployable and testable:
- No shared code libraries in MVP (duplicate common code if needed)
- No direct database access between services
- All inter-service communication via REST APIs
- Each service has its own package.json and dependencies

### Database Schema Evolution

For MVP, use simple schema without migrations:
- Define schemas in code using Mongoose
- Schemas auto-create on first connection
- Future: Add migration tooling for schema changes

### Security Considerations (Future Enhancements)

MVP focuses on functionality, but note these for future phases:
- Password hashing (use bcrypt)
- JWT token validation
- API authentication/authorization
- HTTPS/TLS for inter-service communication
- Network policies in Kubernetes
- Secret management (external secret store)

### Scalability Considerations

MVP uses single replicas, but architecture supports scaling:
- Stateless services can scale horizontally
- Database per service enables independent scaling
- Future: Add caching layer (Redis)
- Future: Add message queue for async operations
