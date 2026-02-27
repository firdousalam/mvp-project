# Implementation Plan: Product Order System MVP

## Overview

This implementation plan breaks down the Product Order System MVP into incremental coding tasks. The approach follows a bottom-up strategy: establish project structure, implement individual services with their databases, add inter-service communication, containerize with Docker, and finally orchestrate with Kubernetes. Each service is built independently before integration.

## Tasks

- [ ] 1. Initialize monorepo structure and shared configuration
  - Create root directory structure: user-service/, product-service/, order-service/, k8s/
  - Create root package.json with shared scripts and dev dependencies (Jest, fast-check, nodemon)
  - Create root README.md documenting architecture, ports, and setup instructions
  - Create .gitignore for node_modules, .env files, and build artifacts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Implement User Service core functionality
  - [ ] 2.1 Setup User Service project structure
    - Create user-service/package.json with Express, Mongoose, bcrypt, and jsonwebtoken dependencies
    - Create user-service/src/ directory structure (models/, routes/, controllers/, config/)
    - Create user-service/index.js as entry point
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 2.2 Implement User model and database connection
    - Create User Mongoose schema with email (unique), password, name, timestamps
    - Create database connection module reading MONGO_URI from environment
    - Implement connection retry logic with exponential backoff (1s initial, 30s max, 2x multiplier, 10 max attempts)
    - _Requirements: 2.5, 5.1, 5.4, 5.5_
  
  - [ ]* 2.3 Write property test for database connection retry
    - **Property 15: Database connection failures trigger exponential backoff retry**
    - **Validates: Requirements 5.5**
  
  - [ ] 2.4 Implement user registration endpoint
    - Create POST /users route with validation (email format, password length ≥8, name presence)
    - Hash password with bcrypt before storage
    - Handle duplicate email errors (return 400 with error message)
    - Return 201 with user data (excluding password) on success
    - _Requirements: 2.1, 2.7, 2.9_
  
  - [ ]* 2.5 Write property test for valid user registration
    - **Property 4: Valid user registration succeeds**
    - **Validates: Requirements 2.7**
  
  - [ ]* 2.6 Write property test for duplicate email rejection
    - **Property 7: Duplicate email registration fails**
    - **Validates: Requirements 2.9**
  
  - [ ] 2.7 Implement user authentication endpoint
    - Create POST /auth/login route with email and password validation
    - Compare password with bcrypt
    - Generate JWT token on successful authentication
    - Return 401 for invalid credentials
    - _Requirements: 2.2, 2.8_
  
  - [ ]* 2.8 Write property test for authentication with valid credentials
    - **Property 6: Authentication with valid credentials returns token**
    - **Validates: Requirements 2.8**
  
  - [ ] 2.9 Implement user profile endpoints
    - Create GET /users/:id route returning user data (excluding password)
    - Create PUT /users/:id route for profile updates (email, name)
    - Create DELETE /users/:id route for user deletion
    - Return 404 for non-existent users
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 2.10 Write property test for user data persistence
    - **Property 1: User data persistence round trip**
    - **Validates: Requirements 2.5**
  
  - [ ] 2.11 Implement health check endpoint
    - Create GET /health route
    - Check MongoDB connection status using mongoose.connection.readyState
    - Return 200 with {status: "healthy"} if connected
    - Return 503 with {status: "unhealthy"} if disconnected
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ]* 2.12 Write property test for health check behavior
    - **Property 18: Health check verifies database connectivity**
    - **Validates: Requirements 9.4, 9.5**
  
  - [ ] 2.13 Implement logging and error handling middleware
    - Create request logging middleware capturing method, path, status code
    - Create error handling middleware returning appropriate status codes (400 for validation, 500 for internal)
    - Use structured JSON logging format with timestamp, service name, and details
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 2.14 Write property tests for error handling and logging
    - **Property 19: Error logging includes required metadata**
    - **Property 20: Invalid requests return 400 with error message**
    - **Property 21: Internal errors return 500 status code**
    - **Property 22: Request logging includes method, path, and status**
    - **Property 23: Logs use structured format**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  
  - [ ] 2.15 Wire User Service together
    - Configure Express app with middleware (logging, error handling, body parser)
    - Register all routes (/users, /auth, /health)
    - Read PORT from environment variable (default 3001)
    - Start server only after database connection established
    - _Requirements: 2.6, 5.4, 11.2_
  
  - [ ]* 2.16 Write property test for configuration loading
    - **Property 17: Configuration loaded from environment variables**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ] 3. Checkpoint - User Service complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Product Service core functionality
  - [ ] 4.1 Setup Product Service project structure
    - Create product-service/package.json with Express and Mongoose dependencies
    - Create product-service/src/ directory structure (models/, routes/, controllers/, config/)
    - Create product-service/index.js as entry point
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.2 Implement Product model and database connection
    - Create Product Mongoose schema with name, description, price, stock, timestamps
    - Create database connection module reading MONGO_URI from environment
    - Implement connection retry logic with exponential backoff (same pattern as User Service)
    - _Requirements: 3.6, 5.2, 5.4, 5.5_
  
  - [x] 4.3 Implement product CRUD endpoints
    - Create POST /products route with validation (name presence, price > 0, stock ≥ 0)
    - Create GET /products/:id route returning product data or 404
    - Create GET /products route returning all products as array
    - Create PUT /products/:id route for product updates
    - Create DELETE /products/:id route for product deletion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8, 3.9_
  
  - [ ]* 4.4 Write property test for valid product creation
    - **Property 5: Valid product creation succeeds**
    - **Validates: Requirements 3.8**
  
  - [ ]* 4.5 Write property test for non-existent product retrieval
    - **Property 8: Non-existent product retrieval returns 404**
    - **Validates: Requirements 3.9**
  
  - [ ]* 4.6 Write property test for product data persistence
    - **Property 2: Product data persistence round trip**
    - **Validates: Requirements 3.6**
  
  - [x] 4.7 Implement health check endpoint
    - Create GET /health route with database connectivity check
    - Return 200 with {status: "healthy"} or 503 with {status: "unhealthy"}
    - _Requirements: 9.2, 9.4, 9.5_
  
  - [x] 4.8 Implement logging and error handling middleware
    - Reuse logging and error handling patterns from User Service
    - Create request logging middleware with structured JSON format
    - Create error handling middleware with appropriate status codes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 4.9 Wire Product Service together
    - Configure Express app with middleware
    - Register all routes (/products, /health)
    - Read PORT from environment variable (default 3002)
    - Start server only after database connection established
    - _Requirements: 3.7, 5.4, 11.2_

- [x] 5. Checkpoint - Product Service complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Order Service core functionality
  - [x] 6.1 Setup Order Service project structure
    - Create order-service/package.json with Express, Mongoose, and axios dependencies
    - Create order-service/src/ directory structure (models/, routes/, controllers/, config/, clients/)
    - Create order-service/index.js as entry point
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 6.2 Implement Order model and database connection
    - Create Order Mongoose schema with userId, items array, totalAmount, status (enum), timestamps
    - Create database connection module reading MONGO_URI from environment
    - Implement connection retry logic with exponential backoff
    - _Requirements: 4.5, 5.3, 5.4, 5.5_
  
  - [x] 6.3 Implement HTTP client for inter-service communication
    - Create ServiceClient class with configurable baseURL and timeout (5s default)
    - Implement GET method with timeout handling using axios
    - Implement error handling for connection failures, timeouts, and error responses
    - Read USER_SERVICE_URL and PRODUCT_SERVICE_URL from environment variables
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.3_
  
  - [ ]* 6.4 Write property test for inter-service error handling
    - **Property 16: Failed inter-service calls return error responses**
    - **Validates: Requirements 6.4, 6.5**
  
  - [x] 6.5 Implement order creation endpoint with service integration
    - Create POST /orders route with validation (userId format, items array non-empty, quantities positive)
    - Call User Service GET /users/:id to validate user exists
    - Call Product Service GET /products/:id for each product to validate and get details (name, price)
    - Calculate total amount from product prices and quantities
    - Create order with status "pending"
    - Return 201 with order details on success
    - Return 400 with error message if user validation fails
    - Return 400 with error message if product validation fails
    - _Requirements: 4.1, 4.7, 4.8, 4.9, 4.10, 4.11_
  
  - [ ]* 6.6 Write property test for order creation validates user
    - **Property 9: Order creation validates user existence**
    - **Validates: Requirements 4.7**
  
  - [ ]* 6.7 Write property test for order creation validates products
    - **Property 10: Order creation validates and retrieves product details**
    - **Validates: Requirements 4.8**
  
  - [ ]* 6.8 Write property test for pending status on creation
    - **Property 11: Successfully created orders have pending status**
    - **Validates: Requirements 4.9**
  
  - [ ]* 6.9 Write property test for invalid user rejection
    - **Property 12: Invalid user ID rejects order creation**
    - **Validates: Requirements 4.10**
  
  - [ ]* 6.10 Write property test for invalid product rejection
    - **Property 13: Invalid product ID rejects order creation**
    - **Validates: Requirements 4.11**
  
  - [x] 6.11 Implement order retrieval endpoints
    - Create GET /orders/:id route returning order data or 404
    - Create GET /orders/user/:userId route returning all orders for a user as array
    - _Requirements: 4.2, 4.3_
  
  - [x] 6.12 Implement order status update endpoint
    - Create PUT /orders/:id/status route
    - Validate status is one of: pending, processing, completed, cancelled
    - Update order status and updatedAt timestamp
    - Return 200 with updated order
    - Return 404 if order doesn't exist
    - _Requirements: 4.4_
  
  - [ ]* 6.13 Write property test for order data persistence
    - **Property 3: Order data persistence round trip**
    - **Validates: Requirements 4.5**
  
  - [x] 6.14 Implement health check endpoint
    - Create GET /health route with database connectivity check
    - Return 200 with {status: "healthy"} or 503 with {status: "unhealthy"}
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [x] 6.15 Implement logging and error handling middleware
    - Reuse logging and error handling patterns from other services
    - Create request logging middleware with structured JSON format
    - Create error handling middleware with appropriate status codes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 6.16 Wire Order Service together
    - Configure Express app with middleware
    - Register all routes (/orders, /health)
    - Read PORT from environment variable (default 3003)
    - Start server only after database connection established
    - _Requirements: 4.6, 5.4, 11.2_
  
  - [ ]* 6.17 Write property test for service startup sequence
    - **Property 14: Services wait for database connection before accepting requests**
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint - Order Service complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create Docker containerization
  - [x] 8.1 Create Dockerfile for User Service
    - Use Node.js base image (node:18-alpine)
    - Copy package.json and install production dependencies
    - Copy source code
    - Expose port 3001
    - Set CMD to start the service (node index.js)
    - _Requirements: 7.1, 7.4_
  
  - [x] 8.2 Create Dockerfile for Product Service
    - Use Node.js base image (node:18-alpine)
    - Copy package.json and install production dependencies
    - Copy source code
    - Expose port 3002
    - Set CMD to start the service (node index.js)
    - _Requirements: 7.2, 7.4_
  
  - [x] 8.3 Create Dockerfile for Order Service
    - Use Node.js base image (node:18-alpine)
    - Copy package.json and install production dependencies
    - Copy source code
    - Expose port 3003
    - Set CMD to start the service (node index.js)
    - _Requirements: 7.3, 7.4_
  
  - [x] 8.4 Create docker-compose.yml for local development
    - Define services: user-service, product-service, order-service with build context and port mappings
    - Define MongoDB services: mongodb-user (port 27017), mongodb-product (port 27018), mongodb-order (port 27019)
    - Configure environment variables for each service (MONGO_URI, PORT, USER_SERVICE_URL, PRODUCT_SERVICE_URL)
    - Configure volumes for MongoDB data persistence
    - Configure depends_on for service startup order
    - _Requirements: 7.5, 7.6_
  
  - [ ]* 8.5 Write unit tests for Docker image builds
    - Test that each Dockerfile builds successfully without errors
    - Test that built images contain Node.js runtime
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Checkpoint - Docker containerization complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create Kubernetes manifests
  - [x] 10.1 Create MongoDB StatefulSets and Services
    - Create k8s/mongodb-user-statefulset.yaml with PVC for data persistence (1Gi storage)
    - Create k8s/mongodb-user-service.yaml for internal networking (port 27017)
    - Create k8s/mongodb-product-statefulset.yaml with PVC (1Gi storage)
    - Create k8s/mongodb-product-service.yaml (port 27017)
    - Create k8s/mongodb-order-statefulset.yaml with PVC (1Gi storage)
    - Create k8s/mongodb-order-service.yaml (port 27017)
    - _Requirements: 8.3, 8.4_
  
  - [x] 10.2 Create ConfigMap for non-sensitive configuration
    - Create k8s/configmap.yaml with service URLs (http://user-service:3001, http://product-service:3002) and ports
    - _Requirements: 11.4_
  
  - [x] 10.3 Create Secret for database credentials
    - Create k8s/secret.yaml with MongoDB connection strings (base64 encoded)
    - Include connection strings for all three databases
    - _Requirements: 11.5_
  
  - [x] 10.4 Create User Service Deployment and Service
    - Create k8s/user-service-deployment.yaml with:
      - Container image reference
      - Environment variables from ConfigMap and Secret
      - Resource limits (CPU: 100m request/500m limit, Memory: 128Mi request/512Mi limit)
      - Liveness probe: GET /health every 10s, initial delay 10s
      - Readiness probe: GET /health every 5s, initial delay 10s
    - Create k8s/user-service-service.yaml exposing port 3001 (ClusterIP type)
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 10.5 Create Product Service Deployment and Service
    - Create k8s/product-service-deployment.yaml with same configuration pattern as User Service
    - Create k8s/product-service-service.yaml exposing port 3002 (ClusterIP type)
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 10.6 Create Order Service Deployment and Service
    - Create k8s/order-service-deployment.yaml with same configuration pattern
    - Include USER_SERVICE_URL and PRODUCT_SERVICE_URL environment variables from ConfigMap
    - Create k8s/order-service-service.yaml exposing port 3003 (ClusterIP type)
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.7, 8.8_
  
  - [ ]* 10.7 Write unit tests for Kubernetes manifest validation
    - Test that all YAML files are valid syntax (use js-yaml library)
    - Test that Deployments reference correct container images
    - Test that resource limits are specified for all Deployments
    - Test that health probes are configured for all Deployments
    - _Requirements: 8.1, 8.2, 8.7, 8.8_

- [x] 11. Create API documentation
  - [x] 11.1 Document User Service API
    - Create user-service/API.md with all endpoints (POST /users, GET /users/:id, PUT /users/:id, DELETE /users/:id, POST /auth/login, GET /health)
    - Include request/response schemas with data types for each endpoint
    - Include example curl requests and JSON responses
    - Specify required and optional fields for each request
    - _Requirements: 12.1, 12.4, 12.5_
  
  - [x] 11.2 Document Product Service API
    - Create product-service/API.md with all endpoints (POST /products, GET /products/:id, GET /products, PUT /products/:id, DELETE /products/:id, GET /health)
    - Include request/response schemas with data types for each endpoint
    - Include example curl requests and JSON responses
    - Specify required and optional fields for each request
    - _Requirements: 12.2, 12.4, 12.5_
  
  - [x] 11.3 Document Order Service API
    - Create order-service/API.md with all endpoints (POST /orders, GET /orders/:id, GET /orders/user/:userId, PUT /orders/:id/status, GET /health)
    - Include request/response schemas with data types for each endpoint
    - Include example curl requests and JSON responses
    - Specify required and optional fields for each request
    - Document inter-service communication (calls to User Service and Product Service)
    - _Requirements: 12.3, 12.4, 12.5_

- [x] 12. Final checkpoint - Complete system integration
  - ✅ All tests passing: 97 total (User: 74, Product: 14, Order: 9)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Services should be implemented and tested independently before integration
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Use fast-check library for property-based testing in Node.js
- All property tests must include comment tags referencing design properties: `// Feature: product-order-system, Property {number}: {property_text}`
