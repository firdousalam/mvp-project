# 🚀 Quick Start Guide - Product Order System

## Prerequisites

Before running the system locally, ensure you have:

1. **Node.js 18+** installed
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** installed
   - Download from: https://www.mongodb.com/try/download/community
   - Verify: `mongod --version`

3. **Git** (if cloning from repository)

### Quick Check
Run this to verify all prerequisites:
```cmd
check-prerequisites.bat
```

This will check if Node.js, npm, MongoDB, and service dependencies are installed.

## 🎯 Option 1: Run with Automated Scripts (Recommended)

### Windows Users:

1. **Install dependencies for all services:**
   ```cmd
   cd user-service
   npm install
   cd ..

   cd product-service
   npm install
   cd ..

   cd order-service
   npm install
   cd ..
   ```

2. **Start everything:**
   ```cmd
   start-local.bat
   ```

   This will:
   - Start 3 MongoDB instances (ports 27017, 27018, 27019)
   - Start User Service (port 3001)
   - Start Product Service (port 3002)
   - Start Order Service (port 3003)

3. **Open the test dashboard:**
   - Open `test-api.html` in your browser
   - Or visit: http://localhost:3001/health

4. **Stop everything:**
   ```cmd
   stop-local.bat
   ```

## 🐳 Option 2: Run with Docker Compose (Easiest)

If you have Docker installed:

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

Services will be available at:
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003

## 🧪 Option 3: Manual Setup (For Development)

### Step 1: Start MongoDB Instances

Open 3 separate terminals:

**Terminal 1 - User DB:**
```cmd
mongod --port 27017 --dbpath data/userdb
```

**Terminal 2 - Product DB:**
```cmd
mongod --port 27018 --dbpath data/productdb
```

**Terminal 3 - Order DB:**
```cmd
mongod --port 27019 --dbpath data/orderdb
```

### Step 2: Start Services

Open 3 more terminals:

**Terminal 4 - User Service:**
```cmd
cd user-service
npm start
```

**Terminal 5 - Product Service:**
```cmd
cd product-service
npm start
```

**Terminal 6 - Order Service:**
```cmd
cd order-service
npm start
```

## ✅ Verify Everything is Running

### Method 1: Use the Test Dashboard
Open `test-api.html` in your browser and click "Check All Services"

### Method 2: Use curl or browser

```bash
# Check User Service
curl http://localhost:3001/health

# Check Product Service
curl http://localhost:3002/health

# Check Order Service
curl http://localhost:3003/health
```

All should return: `{"status":"healthy"}`

## 🎮 Test the System

### Using the Web Dashboard (Easiest)
1. Open `test-api.html` in your browser
2. Click "Run Full Demo" to test the complete workflow
3. Or test individual endpoints manually

### Using curl (Command Line)

**1. Create a User:**
```bash
curl -X POST http://localhost:3001/users ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\",\"name\":\"John Doe\"}"
```

**2. Create a Product:**
```bash
curl -X POST http://localhost:3002/products ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Laptop\",\"description\":\"Gaming laptop\",\"price\":1299.99,\"stock\":5}"
```

**3. Create an Order:**
```bash
curl -X POST http://localhost:3003/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"USER_ID_FROM_STEP_1\",\"items\":[{\"productId\":\"PRODUCT_ID_FROM_STEP_2\",\"quantity\":1}]}"
```

### Using Postman
Import the endpoints from the API documentation:
- [User Service API](./user-service/API.md)
- [Product Service API](./product-service/API.md)
- [Order Service API](./order-service/API.md)

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Run tests for specific service
cd user-service && npm test
cd product-service && npm test
cd order-service && npm test
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- **Error:** "MongoServerError: connect ECONNREFUSED"
- **Solution:** Make sure MongoDB is running on the correct ports (27017, 27018, 27019)

### Port Already in Use
- **Error:** "EADDRINUSE: address already in use"
- **Solution:** 
  - Stop existing services: `stop-local.bat`
  - Or change ports in service configuration

### Services Can't Communicate
- **Error:** Order service can't reach User/Product service
- **Solution:** 
  - Verify all services are running
  - Check environment variables in docker-compose.yml or service configs

### MongoDB Data Directory Issues
- **Error:** "Data directory not found"
- **Solution:** Create directories manually:
  ```cmd
  mkdir data\userdb
  mkdir data\productdb
  mkdir data\orderdb
  ```

## 📊 Service Endpoints

### User Service (Port 3001)
- `GET /health` - Health check
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /auth/login` - Login

### Product Service (Port 3002)
- `GET /health` - Health check
- `POST /products` - Create product
- `GET /products` - List all products
- `GET /products/:id` - Get product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Order Service (Port 3003)
- `GET /health` - Health check
- `POST /orders` - Create order
- `GET /orders/:id` - Get order
- `GET /orders/user/:userId` - Get user's orders
- `PUT /orders/:id/status` - Update order status

## 🎯 Next Steps

1. **Explore the API** using the test dashboard
2. **Read the documentation** in each service's API.md file
3. **Deploy to Kubernetes** using the k8s/ manifests
4. **Add monitoring** with Prometheus/Grafana
5. **Add API Gateway** with Nginx Ingress

## 📚 Additional Resources

- [Full README](./README.md)
- [Architecture Documentation](./.kiro/specs/product-order-system/design.md)
- [Requirements](./.kiro/specs/product-order-system/requirements.md)

## 💡 Tips

- Use the web dashboard (`test-api.html`) for quick testing
- Check service logs in the terminal windows for debugging
- MongoDB data persists in the `data/` directory
- Use `stop-local.bat` to cleanly shut down all services

---

**Need Help?** Check the troubleshooting section or review the service logs for error messages.
