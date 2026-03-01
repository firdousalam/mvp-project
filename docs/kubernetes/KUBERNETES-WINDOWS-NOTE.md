# Kubernetes on Windows - Important Note

## Port 80 Conflict with IIS

On Windows, port 80 is often used by IIS (Internet Information Services). This prevents the Kubernetes ingress from binding to port 80.

## Solution: Use Port-Forward

Instead of accessing the ingress on port 80, use port-forward to access it on port 8080:

### Start Port-Forward

```powershell
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
```

Keep this terminal window open while using the application.

### Access the Application

Now you can access all services through `http://localhost:8080`:

```powershell
# Health check
curl http://localhost:8080/health

# Create a user
curl -X POST http://localhost:8080/users `
  -H "Content-Type: application/json" `
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Create a product
curl -X POST http://localhost:8080/products `
  -H "Content-Type: application/json" `
  -d '{"name":"Laptop","description":"Gaming laptop","price":1299.99,"stock":5}'

# Create an order
curl -X POST http://localhost:8080/orders `
  -H "Content-Type: application/json" `
  -d '{"userId":"USER_ID_HERE","items":[{"productId":"PRODUCT_ID_HERE","quantity":1}]}'
```

## Alternative: Stop IIS

If you want to use port 80, you can stop IIS:

```powershell
# Stop IIS (requires Administrator)
Stop-Service W3SVC

# Start IIS again when done
Start-Service W3SVC
```

## Update test-api-gateway.html

If you're using the test dashboard, update the base URL to use port 8080:

```javascript
// Change this line in test-api-gateway.html
const BASE_URL = 'http://localhost:8080';
```

## Automated Script

Add this to your `package.json` scripts:

```json
{
  "k8s:port-forward": "kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80"
}
```

Then run:
```powershell
npm run k8s:port-forward
```

## Summary

✅ **Working Setup:**
1. Deploy to Kubernetes: `npm run k8s:deploy`
2. Start port-forward: `kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80`
3. Access application: `http://localhost:8080`

🎉 Your microservices are now running on Kubernetes!
