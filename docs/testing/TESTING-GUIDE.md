# Testing Guide - Browser & Postman

Complete guide for testing the Product Order System using a browser or Postman.

## 🌐 Base URL

Since you're running on Kubernetes with port-forward:

```
http://localhost:8080
```

**Important:** Make sure the port-forward is running:
```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

---

## 🎨 Option 1: Browser Testing (Easiest)

### Step 1: Open the Test Dashboard

1. Open `test-api-gateway.html` in your browser
2. The dashboard provides a visual interface to test all APIs

### Step 2: Update the Base URL (if needed)

The file should already be configured, but if not, open `test-api-gateway.html` and ensure:

```javascript
const BASE_URL = 'http://localhost:8080';
```

### Step 3: Use the Dashboard

The dashboard has buttons for:
- ✅ Creating users
- ✅ Creating products
- ✅ Creating orders
- ✅ Viewing all data
- ✅ Health checks

Just click the buttons and see the results!

---

## 📮 Option 2: Postman Testing

### Step 1: Import Collection

Create a new Postman collection called "Product Order System"

### Step 2: Set Environment Variable

1. Click the eye icon (👁️) in top-right
2. Add a new environment called "Kubernetes Local"
3. Add variable:
   - **Variable:** `baseUrl`
   - **Value:** `http://localhost:8080`

### Step 3: Create Requests

#### 1. Health Check

```
GET {{baseUrl}}/health
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

#### 2. Create User

```
POST {{baseUrl}}/users
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (201 Created):**
```json
{
  "id": "69a426ebfdd94baec71ff74d",
  "email": "john@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-01T11:45:47.749Z"
}
```

**Save the `id` for later use!**

---

#### 3. Login User

```
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69a426ebfdd94baec71ff74d",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

---

#### 4. Get User by ID

```
GET {{baseUrl}}/users/69a426ebfdd94baec71ff74d
```

**Expected Response (200 OK):**
```json
{
  "id": "69a426ebfdd94baec71ff74d",
  "email": "john@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-01T11:45:47.749Z"
}
```

---

#### 5. Update User

```
PUT {{baseUrl}}/users/69a426ebfdd94baec71ff74d
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

---

#### 6. Create Product

```
POST {{baseUrl}}/products
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "stock": 10
}
```

**Expected Response (201 Created):**
```json
{
  "id": "69a426f735bcdef87e7edcb6",
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "stock": 10,
  "createdAt": "2026-03-01T11:45:59.390Z"
}
```

**Save the `id` for later use!**

---

#### 7. Get Product by ID

```
GET {{baseUrl}}/products/69a426f735bcdef87e7edcb6
```

---

#### 8. Get All Products

```
GET {{baseUrl}}/products
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "69a426f735bcdef87e7edcb6",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop",
    "price": 1299.99,
    "stock": 10,
    "createdAt": "2026-03-01T11:45:59.390Z"
  }
]
```

---

#### 9. Update Product

```
PUT {{baseUrl}}/products/69a426f735bcdef87e7edcb6
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Gaming Laptop Pro",
  "price": 1499.99,
  "stock": 5
}
```

---

#### 10. Create Order

```
POST {{baseUrl}}/orders
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": "69a426ebfdd94baec71ff74d",
  "items": [
    {
      "productId": "69a426f735bcdef87e7edcb6",
      "quantity": 2
    }
  ]
}
```

**Expected Response (201 Created):**
```json
{
  "id": "69a42712f48f02b71abf2e1d",
  "userId": "69a426ebfdd94baec71ff74d",
  "items": [
    {
      "productId": "69a426f735bcdef87e7edcb6",
      "productName": "Gaming Laptop",
      "price": 1299.99,
      "quantity": 2
    }
  ],
  "totalAmount": 2599.98,
  "status": "pending",
  "createdAt": "2026-03-01T11:46:27.000Z"
}
```

---

#### 11. Get Order by ID

```
GET {{baseUrl}}/orders/69a42712f48f02b71abf2e1d
```

---

#### 12. Get Orders by User

```
GET {{baseUrl}}/orders/user/69a426ebfdd94baec71ff74d
```

---

#### 13. Update Order Status

```
PUT {{baseUrl}}/orders/69a42712f48f02b71abf2e1d/status
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "status": "processing"
}
```

**Valid statuses:** `pending`, `processing`, `completed`, `cancelled`

---

#### 14. Delete User

```
DELETE {{baseUrl}}/users/69a426ebfdd94baec71ff74d
```

---

#### 15. Delete Product

```
DELETE {{baseUrl}}/products/69a426f735bcdef87e7edcb6
```

---

## 🔄 Complete Test Flow

### 1. Create Test Data

```
1. POST /users → Save user ID
2. POST /auth/login → Verify login works
3. POST /products → Save product ID
4. GET /products → Verify product appears
```

### 2. Create Order

```
5. POST /orders → Use saved user ID and product ID
6. GET /orders/:id → Verify order created
7. GET /orders/user/:userId → Verify order appears for user
```

### 3. Update Order

```
8. PUT /orders/:id/status → Change to "processing"
9. PUT /orders/:id/status → Change to "completed"
```

### 4. Cleanup (Optional)

```
10. DELETE /users/:id
11. DELETE /products/:id
```

---

## 🎯 Postman Collection JSON

Save this as `Product-Order-System.postman_collection.json`:

```json
{
  "info": {
    "name": "Product Order System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/users",
          "host": ["{{baseUrl}}"],
          "path": ["users"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      }
    },
    {
      "name": "Create Product",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Gaming Laptop\",\n  \"description\": \"High-performance gaming laptop\",\n  \"price\": 1299.99,\n  \"stock\": 10\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/products",
          "host": ["{{baseUrl}}"],
          "path": ["products"]
        }
      }
    },
    {
      "name": "Get All Products",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/products",
          "host": ["{{baseUrl}}"],
          "path": ["products"]
        }
      }
    },
    {
      "name": "Create Order",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"USER_ID_HERE\",\n  \"items\": [\n    {\n      \"productId\": \"PRODUCT_ID_HERE\",\n      \"quantity\": 2\n    }\n  ]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/orders",
          "host": ["{{baseUrl}}"],
          "path": ["orders"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080"
    }
  ]
}
```

---

## 🌐 Browser Console Testing

Open browser console (F12) and run:

```javascript
// Set base URL
const BASE_URL = 'http://localhost:8080';

// Create user
fetch(`${BASE_URL}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log('User created:', data));

// Create product
fetch(`${BASE_URL}/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Gaming Laptop',
    description: 'High-performance laptop',
    price: 1299.99,
    stock: 10
  })
})
.then(res => res.json())
.then(data => console.log('Product created:', data));

// Get all products
fetch(`${BASE_URL}/products`)
  .then(res => res.json())
  .then(data => console.log('Products:', data));
```

---

## 📝 Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/users` | POST | Create user |
| `/users/:id` | GET | Get user |
| `/users/:id` | PUT | Update user |
| `/users/:id` | DELETE | Delete user |
| `/auth/login` | POST | Login |
| `/products` | POST | Create product |
| `/products` | GET | Get all products |
| `/products/:id` | GET | Get product |
| `/products/:id` | PUT | Update product |
| `/products/:id` | DELETE | Delete product |
| `/orders` | POST | Create order |
| `/orders/:id` | GET | Get order |
| `/orders/user/:userId` | GET | Get user orders |
| `/orders/:id/status` | PUT | Update order status |

---

## 🐛 Troubleshooting

### "Failed to fetch" or "Network Error"

1. **Check port-forward is running:**
   ```powershell
   kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
   ```

2. **Verify pods are running:**
   ```powershell
   kubectl get pods -n product-order-system
   ```

3. **Test with curl first:**
   ```powershell
   curl http://localhost:8080/health
   ```

### CORS Errors in Browser

The services should have CORS enabled. If you see CORS errors, check the service logs:

```powershell
kubectl logs -l app=user-service -n product-order-system
```

### 404 Not Found

Make sure you're using the correct base URL: `http://localhost:8080` (not port 80)

---

## 🎉 Success!

You're now ready to test your microservices! Start with the browser dashboard (`test-api-gateway.html`) for the easiest experience.
