# Product Service API Documentation

## Overview

The Product Service manages the product catalog, including product creation, updates, retrieval, and deletion. It runs on port 3002 and provides REST API endpoints for product management.

Base URL: `http://localhost:3002`

## Endpoints

### 1. Create Product

Creates a new product in the catalog.

**Endpoint:** `POST /products`

**Request Body:**
```json
{
  "name": "string (required, non-empty)",
  "description": "string (optional)",
  "price": "number (required, positive)",
  "stock": "number (required, non-negative integer)"
}
```

**Success Response (201 Created):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "createdAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (missing required fields, negative price, negative stock)
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "stock": 150
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 29.99,
  "stock": 150,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Get Product by ID

Retrieves a specific product by its ID.

**Endpoint:** `GET /products/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `404 Not Found` - Product does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X GET http://localhost:3002/products/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 29.99,
  "stock": 150,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. List All Products

Retrieves all products in the catalog.

**Endpoint:** `GET /products`

**Success Response (200 OK):**
```json
{
  "products": [
    {
      "id": "string (MongoDB ObjectId)",
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "number",
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
curl -X GET http://localhost:3002/products
```

**Example Response:**
```json
{
  "products": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with USB receiver",
      "price": 29.99,
      "stock": 150,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mechanical Keyboard",
      "description": "RGB mechanical keyboard with blue switches",
      "price": 89.99,
      "stock": 75,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Update Product

Updates an existing product's information.

**Endpoint:** `PUT /products/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Request Body:**
```json
{
  "name": "string (optional, non-empty)",
  "description": "string (optional)",
  "price": "number (optional, positive)",
  "stock": "number (optional, non-negative integer)"
}
```

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input (negative price, negative stock)
- `404 Not Found` - Product does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X PUT http://localhost:3002/products/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 24.99,
    "stock": 200
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 24.99,
  "stock": 200,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z"
}
```

---

### 5. Delete Product

Deletes a product from the catalog.

**Endpoint:** `DELETE /products/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the product

**Success Response (200 OK):**
```json
{
  "message": "Product deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Product does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X DELETE http://localhost:3002/products/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "message": "Product deleted successfully"
}
```

---

### 6. Health Check

Checks the health status of the Product Service and its database connection.

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
curl -X GET http://localhost:3002/health
```

**Example Response:**
```json
{
  "status": "healthy"
}
```

---

## Data Models

### Product Schema

```javascript
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "price": "Number",
  "stock": "Number",
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

### Name
- Non-empty string
- Required for product creation

### Description
- Optional string
- Can be empty or omitted

### Price
- Must be a positive number (> 0)
- Required for product creation
- Supports decimal values

### Stock
- Must be a non-negative integer (≥ 0)
- Required for product creation
- Represents available inventory quantity

## Notes

- All timestamps are in ISO 8601 format
- MongoDB ObjectIds are 24-character hexadecimal strings
- Price values support decimal precision for currency
- Stock values must be whole numbers (integers)
- The service returns 404 for non-existent product IDs
