# 🎉 Kubernetes Deployment - SUCCESS!

Your Product Order System is now running on Kubernetes!

## ✅ What's Running

```
✅ MongoDB User Database (StatefulSet)
✅ MongoDB Product Database (StatefulSet)
✅ MongoDB Order Database (StatefulSet)
✅ User Service (Deployment)
✅ Product Service (Deployment)
✅ Order Service (Deployment)
✅ Nginx Ingress Controller
✅ Ingress Routes
```

## 🚀 How to Access

### Step 1: Start Port-Forward (Required on Windows)

```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

**Keep this terminal open!**

### Step 2: Access the Application

All services are now available at `http://localhost:8080`:

- **User Service:** `http://localhost:8080/users`
- **Product Service:** `http://localhost:8080/products`
- **Order Service:** `http://localhost:8080/orders`
- **Health Check:** `http://localhost:8080/health`

## 📝 Quick Test

### Create a User
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/users" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### Create a Product
```powershell
$body = @{
    name = "Laptop"
    description = "Gaming laptop"
    price = 1299.99
    stock = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/products" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### Create an Order
```powershell
$body = @{
    userId = "USER_ID_FROM_ABOVE"
    items = @(
        @{
            productId = "PRODUCT_ID_FROM_ABOVE"
            quantity = 2
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest -Uri "http://localhost:8080/orders" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

## 🛠️ Useful Commands

### Check Pod Status
```powershell
kubectl get pods -n product-order-system
```

### View Logs
```powershell
# User service logs
kubectl logs -l app=user-service -n product-order-system

# Product service logs
kubectl logs -l app=product-service -n product-order-system

# Order service logs
kubectl logs -l app=order-service -n product-order-system
```

### Check Services
```powershell
kubectl get svc -n product-order-system
```

### Check Ingress
```powershell
kubectl get ingress -n product-order-system
kubectl describe ingress product-order-ingress -n product-order-system
```

### Scale Services
```powershell
# Scale user service to 3 replicas
kubectl scale deployment user-service --replicas=3 -n product-order-system
```

### Restart a Service
```powershell
kubectl rollout restart deployment user-service -n product-order-system
```

## 🎨 Use the Test Dashboard

Update `test-api-gateway.html` to use port 8080:

```javascript
// Change the BASE_URL
const BASE_URL = 'http://localhost:8080';
```

Then open `test-api-gateway.html` in your browser!

## 📊 Monitoring

### Watch Pods in Real-Time
```powershell
kubectl get pods -n product-order-system -w
```

### Check Resource Usage
```powershell
kubectl top pods -n product-order-system
kubectl top nodes
```

## 🧹 Cleanup

When you're done:

```powershell
# Stop port-forward (Ctrl+C in the terminal)

# Delete all resources
npm run k8s:cleanup

# Or manually:
kubectl delete namespace product-order-system
kubectl delete -f k8s/ingress.yaml
```

## 🐛 Troubleshooting

### Port-Forward Stops Working
Just restart it:
```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

### Pod Not Starting
Check logs:
```powershell
kubectl logs POD_NAME -n product-order-system
kubectl describe pod POD_NAME -n product-order-system
```

### Can't Connect to MongoDB Atlas
1. Check your MongoDB Atlas connection strings in `k8s/secret.yaml`
2. Ensure your IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for testing)
3. Restart the pods:
```powershell
kubectl rollout restart deployment user-service -n product-order-system
```

## 🎓 What You've Learned

By deploying to Kubernetes, you've gained hands-on experience with:

- ✅ Kubernetes Deployments
- ✅ StatefulSets for databases
- ✅ Services for networking
- ✅ Ingress for routing
- ✅ ConfigMaps and Secrets
- ✅ Health checks and probes
- ✅ Scaling and rolling updates
- ✅ Namespace isolation
- ✅ kubectl commands

## 🚀 Next Steps

1. **Try scaling:** Scale services up and down
2. **Update code:** Make changes and redeploy
3. **Add monitoring:** Set up Prometheus and Grafana
4. **Deploy to cloud:** Try AWS ECS or GKE
5. **Add CI/CD:** Automate deployments with GitHub Actions

## 📚 Documentation

- [Kubernetes Local Setup Guide](./KUBERNETES-LOCAL-SETUP.md)
- [Windows-Specific Notes](./KUBERNETES-WINDOWS-NOTE.md)
- [Troubleshooting Guide](./KUBERNETES-TROUBLESHOOTING.md)
- [API Documentation](./user-service/API.md)

---

**Congratulations!** 🎉 You're now running a production-like microservices architecture on Kubernetes!
