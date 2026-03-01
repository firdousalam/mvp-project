# 🚀 Quick Start - Browser & Postman Testing

## ⚡ 2-Minute Setup

### Step 1: Ensure Kubernetes is Running

```powershell
# Check if pods are running
kubectl get pods -n product-order-system

# Should show all pods as Running
```

### Step 2: Start Port-Forward

```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

**Keep this terminal open!**

---

## 🌐 Option A: Browser Testing (Easiest!)

### Just open this file in your browser:

```
test-api-gateway.html
```

**That's it!** The dashboard is pre-configured to use `http://localhost:8080`

### What you can do:

1. ✅ Click "Run Full Demo" to test everything automatically
2. ✅ Create users, products, and orders individually
3. ✅ View all data in real-time
4. ✅ See request/response details

---

## 📮 Option B: Postman Testing

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button
3. Select file: `Product-Order-System.postman_collection.json`
4. Collection imported! ✅

### Step 2: Test the APIs

The collection is organized into folders:

1. **Health Checks** - Test if services are running
2. **User Service** - Create, read, update, delete users
3. **Product Service** - Manage products
4. **Order Service** - Create and manage orders

### Step 3: Run in Sequence

1. **Create User** → Saves user ID automatically
2. **Login** → Saves auth token
3. **Create Product** → Saves product ID
4. **Create Order** → Uses saved IDs
5. **Update Order Status** → Change order status

**The collection automatically saves IDs between requests!**

---

## 🎯 Quick Test Flow

### Browser (test-api-gateway.html):

1. Open file in browser
2. Click "Run Full Demo"
3. Watch it create user → product → order
4. Done! ✅

### Postman:

1. Import collection
2. Run requests in order:
   - Health Check
   - Create User
   - Create Product
   - Create Order
3. Done! ✅

---

## 📝 Manual Testing Examples

### Using Browser Console (F12):

```javascript
// Create a user
fetch('http://localhost:8080/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Using PowerShell:

```powershell
# Create a user
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/users" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

---

## 🎨 All Available Endpoints

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

### "Failed to fetch" or Connection Error

**Solution:** Make sure port-forward is running:
```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

### Pods Not Running

**Check status:**
```powershell
kubectl get pods -n product-order-system
```

**If pods are crashing, check logs:**
```powershell
kubectl logs POD_NAME -n product-order-system
```

### Wrong Base URL

Make sure you're using:
```
http://localhost:8080
```

NOT:
- ~~http://localhost~~ (missing port)
- ~~http://localhost:80~~ (wrong port)
- ~~http://localhost:3001~~ (direct service port)

---

## 📚 More Information

- **Complete Testing Guide:** [TESTING-GUIDE.md](./TESTING-GUIDE.md)
- **Kubernetes Success Guide:** [KUBERNETES-SUCCESS.md](./KUBERNETES-SUCCESS.md)
- **API Documentation:** 
  - [User Service API](./user-service/API.md)
  - [Product Service API](./product-service/API.md)
  - [Order Service API](./order-service/API.md)

---

## 🎉 You're Ready!

Choose your preferred method:

1. **Browser:** Open `test-api-gateway.html` → Click "Run Full Demo"
2. **Postman:** Import collection → Run requests in sequence

Both work perfectly with your Kubernetes deployment! 🚀
