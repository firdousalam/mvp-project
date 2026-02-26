# Nginx Ingress Controller Setup Guide

This guide explains how to install and configure Nginx Ingress Controller for the Product Order System.

## Prerequisites

- Kubernetes cluster running (Minikube, Docker Desktop, or cloud provider)
- kubectl configured and connected to your cluster
- Helm (optional, for easier installation)

---

## Installation Methods

### Method 1: Using kubectl (Recommended for local development)

#### For Minikube:

```bash
# Enable the ingress addon
minikube addons enable ingress

# Verify installation
kubectl get pods -n ingress-nginx
```

#### For Docker Desktop Kubernetes:

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for the controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

#### For Generic Kubernetes:

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/baremetal/deploy.yaml

# Verify installation
kubectl get pods -n ingress-nginx
```

### Method 2: Using Helm

```bash
# Add the ingress-nginx repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install the ingress controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Verify installation
kubectl get pods -n ingress-nginx
```

---

## Deploy the Application with Ingress

### Step 1: Deploy all services

```bash
# Deploy MongoDB StatefulSets
kubectl apply -f k8s/mongodb-user-statefulset.yaml
kubectl apply -f k8s/mongodb-user-service.yaml
kubectl apply -f k8s/mongodb-product-statefulset.yaml
kubectl apply -f k8s/mongodb-product-service.yaml
kubectl apply -f k8s/mongodb-order-statefulset.yaml
kubectl apply -f k8s/mongodb-order-service.yaml

# Deploy ConfigMap and Secret
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy microservices
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/user-service-service.yaml
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/product-service-service.yaml
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/order-service-service.yaml
```

### Step 2: Deploy the Ingress

```bash
# Apply the ingress configuration
kubectl apply -f k8s/ingress.yaml

# Verify ingress is created
kubectl get ingress
```

### Step 3: Get the Ingress IP/Hostname

#### For Minikube:

```bash
# Get the Minikube IP
minikube ip

# Or use tunnel (in a separate terminal)
minikube tunnel
```

#### For Docker Desktop:

The ingress will be available at `localhost`

#### For Cloud Providers:

```bash
# Get the external IP
kubectl get ingress product-order-ingress
```

---

## Testing the Ingress

Once deployed, you can access all services through a single entry point:

### Using curl:

```bash
# Test User Service
curl http://localhost/users

# Create a user
curl -X POST http://localhost/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test Product Service
curl http://localhost/products

# Create a product
curl -X POST http://localhost/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"stock":10}'

# Test Order Service
curl http://localhost/orders

# Health checks
curl http://localhost/health/user
curl http://localhost/health/product
curl http://localhost/health/order
```

### Using the Web Dashboard:

Update `test-api.html` to use the ingress endpoint:

```javascript
const SERVICES = {
    user: 'http://localhost',
    product: 'http://localhost',
    order: 'http://localhost'
};
```

---

## Route Configuration

The ingress is configured with the following routes:

| Path | Service | Port | Description |
|------|---------|------|-------------|
| `/users/*` | user-service | 3001 | User management endpoints |
| `/auth/*` | user-service | 3001 | Authentication endpoints |
| `/products/*` | product-service | 3002 | Product management endpoints |
| `/orders/*` | order-service | 3003 | Order management endpoints |
| `/health/user` | user-service | 3001 | User service health check |
| `/health/product` | product-service | 3002 | Product service health check |
| `/health/order` | order-service | 3003 | Order service health check |

---

## Troubleshooting

### Ingress Controller Not Starting

```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Check if the controller is running
kubectl get pods -n ingress-nginx
```

### 404 Not Found Errors

```bash
# Verify ingress is created
kubectl get ingress

# Check ingress details
kubectl describe ingress product-order-ingress

# Verify services are running
kubectl get services
```

### Services Not Reachable

```bash
# Check if pods are running
kubectl get pods

# Check service endpoints
kubectl get endpoints

# Test service directly (without ingress)
kubectl port-forward service/user-service 3001:3001
curl http://localhost:3001/health
```

### Minikube Tunnel Issues

```bash
# If using minikube tunnel, ensure it's running
minikube tunnel

# Check minikube status
minikube status
```

---

## Advanced Configuration

### Enable HTTPS/TLS

Create a TLS secret:

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=localhost/O=localhost"

# Create Kubernetes secret
kubectl create secret tls product-order-tls \
  --key tls.key \
  --cert tls.crt
```

Update `ingress.yaml`:

```yaml
spec:
  tls:
  - hosts:
    - localhost
    secretName: product-order-tls
  rules:
  # ... rest of configuration
```

### Add Rate Limiting

Add annotations to `ingress.yaml`:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-connections: "5"
```

### Add CORS Headers

Add annotations to `ingress.yaml`:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
```

---

## Cleanup

To remove the ingress:

```bash
# Delete ingress
kubectl delete -f k8s/ingress.yaml

# Delete all resources
kubectl delete -f k8s/
```

To uninstall Nginx Ingress Controller:

```bash
# If installed with kubectl
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# If installed with Helm
helm uninstall nginx-ingress -n ingress-nginx

# If using Minikube addon
minikube addons disable ingress
```

---

## Production Considerations

1. **Use a proper domain name** instead of localhost
2. **Enable TLS/HTTPS** with valid certificates (Let's Encrypt)
3. **Configure rate limiting** to prevent abuse
4. **Add authentication** at the ingress level
5. **Enable monitoring** with Prometheus metrics
6. **Configure proper CORS** policies
7. **Set up logging** and log aggregation
8. **Use a CDN** for static content
9. **Implement circuit breakers** for resilience
10. **Add request/response size limits**

---

## References

- [Nginx Ingress Controller Documentation](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes Ingress Documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Minikube Ingress Addon](https://minikube.sigs.k8s.io/docs/handbook/addons/ingress/)
