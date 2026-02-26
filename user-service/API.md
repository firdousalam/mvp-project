# User Service API Documentation

## Overview

The User Service manages user accounts, authentication, and profile operations. It runs on port 3001 and provides REST API endpoints for user management.

Base URL: `http://localhost:3001`

## Endpoints

### 1. Create User (Register)

Creates a new user account.

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required, minimum 8 characters)",
  "name": "string (required, non-empty)"
}
```

**Success Response (201 Created):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "email": "string",
  "name": "string",
  "createdAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input or duplicate email
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Get User by ID

Retrieves a user's profile information by their ID.

**Endpoint:** `GET /users/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the user

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "email": "string",
  "name": "string",
  "createdAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `404 Not Found` - User does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X GET http://localhost:3001/users/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Update User Profile

Updates a user's profile information.

**Endpoint:** `PUT /users/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the user

**Request Body:**
```json
{
  "email": "string (optional, valid email format)",
  "name": "string (optional, non-empty)"
}
```

**Success Response (200 OK):**
```json
{
  "id": "string (MongoDB ObjectId)",
  "email": "string",
  "name": "string",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `404 Not Found` - User does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X PUT http://localhost:3001/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith"
  }'
```

**Example Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "name": "John Smith",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z"
}
```

---

### 4. Delete User

Deletes a user account.

**Endpoint:** `DELETE /users/:id`

**URL Parameters:**
- `id` (required) - MongoDB ObjectId of the user

**Success Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - User does not exist
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X DELETE http://localhost:3001/users/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

### 5. User Authentication (Login)

Authenticates a user and returns an authentication token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "token": "string (JWT token)",
  "userId": "string (MongoDB ObjectId)"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepass123"
  }'
```

**Example Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

### 6. Health Check

Checks the health status of the User Service and its database connection.

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
curl -X GET http://localhost:3001/health
```

**Example Response:**
```json
{
  "status": "healthy"
}
```

---

## Data Models

### User Schema

```javascript
{
  "_id": "ObjectId",
  "email": "String (unique, indexed)",
  "password": "String (hashed with bcrypt)",
  "name": "String",
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

### Email
- Must be a valid email format
- Must be unique across all users

### Password
- Minimum 8 characters
- Stored as bcrypt hash (never returned in responses)

### Name
- Non-empty string
- Required for user creation

## Notes

- All timestamps are in ISO 8601 format
- Password fields are never included in response bodies
- MongoDB ObjectIds are 24-character hexadecimal strings
- The service uses bcrypt for password hashing
- JWT tokens are used for authentication (implementation details may vary)
