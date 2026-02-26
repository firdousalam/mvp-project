# Order Service API Documentation

## Overview

The Order Service manages order processing, including order creation, retrieval, and status updates. It runs on port 3003 and provides REST API endpoints for order management. The service communicates with User Service and Product Service to validate orders.

Base URL: `http://localhost:3003`

## Endpoints

### 1. Create Order

Creates a new order after validating the user and products.

**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "userId": "string (required, MongoDB ObjectId)",
  "items": [
    {
      "productId": "string (required, MongoDB ObjectId)",
      "quantity": "number (required, positive integer)"
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "userId": "string (MongoDB ObjectId)",
  "items": [
    {
      "productId": "string (MongoDB ObjectId)",
      "productName": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "totalAmount": "number",
  "status": "string (pending)",
  "createdAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input, user not found, or product not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - User Service or Product Service unavailable

**Example Request:**
```bash
curl -X POST http://localhost:3003/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2
      },
      {
        "productId": "507f1f77bcf86cd799439013",
        "quantity": 1
      }
    ]
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "productName": "Wireless Mouse",
      "price": 29.99,
      "quantity": 2
    },
    {
      "productId": "507f1f77bcf86cd799439013",
      "productName": "USB Cable",
      "price": 9.99,
      "quantity": 1
    }
  ],
  "totalAmount": 69.97,
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Inter-Service Communication:**
- Calls `GET /users/:id` on User Service to validate user exists
- Calls `GET /products/:id` on Product Service for each product to validate and retrieve details (name, price)
- If user validation fails, returns 400 with error message
- If any product validation fails, returns 400 with error message

---

### 2. Get Order by ID

Retrieves a specific order by its ID.

**Endpoint:** `GET /orders/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "userId": "string (MongoDB ObjectId)",
  "items": [
    {
      "productId": "string (MongoDB ObjectId)",
      "productName": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "totalAmount": "number",
  "status": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `404 Not Found` - Order does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X GET http://localhost:3003/orders/507f1f77bcf86cd799439014
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "productName": "Wireless Mouse",
      "price": 29.99,
      "quantity": 2
    }
  ],
  "totalAmount": 59.98,
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 3. List Orders by User

Retrieves all orders for a specific user.

**Endpoint:** `GET /orders/user/:userId`

**URL Parameters:**
- `userId` (required) - MongoDB ObjectId of the user

**Success Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "string (MongoDB ObjectId)",
      "userId": "string (MongoDB ObjectId)",
      "items": [
        {
          "productId": "string (MongoDB ObjectId)",
          "productName": "string",
          "price": "number",
          "quantity": "number"
        }
      ],
      "totalAmount": "number",
      "status": "string",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X GET http://localhost:3003/orders/user/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "orders": [
    {
      "id": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439011",
      "items": [
        {
          "productId": "507f1f77bcf86cd799439012",
          "productName": "Wireless Mouse",
          "price": 29.99,
          "quantity": 2
        }
      ],
      "totalAmount": 59.98,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439015",
      "userId": "507f1f77bcf86cd799439011",
      "items": [
        {
          "productId": "507f1f77bcf86cd799439013",
          "productName": "USB Cable",
          "price": 9.99,
          "quantity": 3
        }
      ],
      "totalAmount": 29.97,
      "status": "pending",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### 4. Update Order Status

Updates the status of an existing order.

**Endpoint:** `PUT /orders/:id/status`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the order

**Request Body:**
```json
{
  "status": "string (required, one of: pending, processing, completed, cancelled)"
}
```

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "userId": "string (MongoDB ObjectId)",
  "items": [
    {
      "productId": "string (MongoDB ObjectId)",
      "productName": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "totalAmount": "number",
  "status": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid status value
- `404 Not Found` - Order does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X PUT http://localhost:3003/orders/507f1f77bcf86cd799439014/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "userId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "productName": "Wireless Mouse",
      "price": 29.99,
      "quantity": 2
    }
  ],
  "totalAmount": 59.98,
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 5. Health Check

Checks the health status of the Order Service and its database connection.

**Endpoint:** `GET /health`

**Success Response (200 OK):**
```json
{
  "status": "healthy"
}
```

**Error Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy"
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3003/health
```

**Example Response:**
```json
{
  "status": "healthy"
}
```

---

## Data Models

### Order Schema

```javascript
{
  "_id": "ObjectId",
  "userId": "String (MongoDB ObjectId)",
  "items": [
    {
      "productId": "String (MongoDB ObjectId)",
      "productName": "String",
      "price": "Number",
      "quantity": "Number"
    }
  ],
  "totalAmount": "Number",
  "status": "String (enum: pending, processing, completed, cancelled)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "string (ERROR_CODE)",
    "message": "string (human-readable error message)",
    "details": "object (optional, additional error details)"
  }
}
```

## Validation Rules

### UserId
- Must be a valid MongoDB ObjectId format
- Required for order creation
- Validated against User Service before order creation

### Items Array
- Must be a non-empty array
- Required for order creation
- Each item must contain productId and quantity

### ProductId
- Must be a valid MongoDB ObjectId format
- Required for each item
- Validated against Product Service before order creation

### Quantity
- Must be a positive integer (> 0)
- Required for each item
- Represents the number of units ordered

### Status
- Must be one of: `pending`, `processing`, `completed`, `cancelled`
- Defaults to `pending` on order creation
- Can only be updated via the status update endpoint

### Total Amount
- Automatically calculated from item prices and quantities
- Cannot be manually set
- Formula: sum of (price × quantity) for all items

## Inter-Service Communication

The Order Service communicates with other services to validate and enrich order data:

### User Service Integration
- **Endpoint Called:** `GET http://user-service:3001/users/:id`
- **Purpose:** Validate that the user exists before creating an order
- **Timing:** During order creation (POST /orders)
- **Error Handling:** If user not found or service unavailable, order creation fails with 400 or 503

### Product Service Integration
- **Endpoint Called:** `GET http://product-service:3002/products/:id`
- **Purpose:** Validate products exist and retrieve product details (name, price)
- **Timing:** During order creation (POST /orders) for each product in items array
- **Error Handling:** If any product not found or service unavailable, order creation fails with 400 or 503

### Service Discovery
- Uses Kubernetes internal DNS for service discovery
- User Service URL: `http://user-service:3001` (configurable via USER_SERVICE_URL env var)
- Product Service URL: `http://product-service:3002` (configurable via PRODUCT_SERVICE_URL env var)

### Timeout Configuration
- Default timeout for inter-service calls: 5 seconds
- Configurable via ServiceClient class
- Prevents cascading failures from slow upstream services

## Notes

- All timestamps are in ISO 8601 format
- MongoDB ObjectIds are 24-character hexadecimal strings
- Orders are created with status "pending" by default
- Total amount is calculated automatically based on product prices and quantities
- The service validates user and product existence before creating orders
- Inter-service communication uses HTTP/REST with JSON payloads
- Service URLs are configurable via environment variables for different deployment environments
