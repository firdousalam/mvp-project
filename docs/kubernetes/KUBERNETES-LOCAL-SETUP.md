# 🚀 Complete Kubernetes Local Setup Guide

**Experience the Full Microservices Architecture Locally**

This guide will help you run the complete Product Order System with:
- ✅ Docker containers
- ✅ Kubernetes orchestration
- ✅ Nginx Ingress Controller
- ✅ Service discovery
- ✅ Load balancing
- ✅ Health checks
- ✅ ConfigMaps and Secrets

---

## 📋 Prerequisites

### Required Software

1. **Docker Desktop** (includes Kubernetes)
   - Download: https://www.docker.com/products/docker-desktop
   - Version: Latest stable
   - RAM: At least 4GB allocated to Docker

2. **kubectl** (Kubernetes CLI)
   - Included with Docker Desktop
   - Verify: `kubectl version --client`

3. **Git** (to clone/manage code)
   - Download: https://git-scm.com/downloads

### Optional but Recommended

4. **k9s** (Kubernetes dashboard in terminal)
   - Download: https://k9scli.io/
   - Makes monitoring easier

5. **Lens** (Kubernetes IDE)
   - Download: https://k8slens.dev/
   - Visual interface for Kubernetes

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer (localhost)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Kubernetes Cluster                        │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Nginx Ingress Controller                 │ │ │
│  │  │         (Port 80/443)                            │ │ │
│  │  └────────────────┬─────────────────────────────────┘ │ │
│  │                   │                                    │ │
│  │         ┌─────────┼─────────┐                         │ │
│  │         │         │         │                         │ │
│  │    ┌────▼───┐ ┌───▼────┐ ┌─▼──────┐                  │ │
│  │    │ User   │ │Product │ │ Order  │                  │ │
│  │    │Service │ │Service │ │Service │                  │ │
│  │    │(Pod)   │ │(Pod)   │ │(Pod)   │                  │ │
│  │    └────┬───┘ └───┬────┘ └─┬──────┘                  │ │
│  │         │         │         │                         │ │
│  │    ┌────▼───┐ ┌───▼────┐ ┌─▼──────┐                  │ │
│  │    │MongoDB │ │MongoDB │ │MongoDB │                  │ │
│  │    │User DB │ │Prod DB │ │Order DB│                  │ │
│  │    │(Pod)   │ │(Pod)   │ │(Pod)   │                  │ │
│  │    └────────┘ └────────┘ └────────┘                  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Setup

### Step 1: Enable Kubernetes in Docker Desktop

1. **Open Docker Desktop**
   - Right-click Docker icon in system tray
   - Click "Settings" or "Preferences"

2. **Enable Kubernetes**
   - Go to "Kubernetes" tab
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"
   - Wait 2-3 minutes for Kubernetes to start

3. **Verify Kubernetes is running**
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```
   
   You should see:
   ```
   NAME             STATUS   ROLES           AGE   VERSION
   docker-desktop   Ready    control-plane   1d    v1.27.2
   ```

---

### Step 2: Build Docker Images

Build all microservice images that Kubernetes will use:

```bash
# Navigate to project directory
cd path/to/product-order-system

# Build User Service
docker build -t user-service:latest ./user-service

# Build Product Service
docker build -t product-service:latest ./product-service

# Build Order Service
docker build -t order-service:latest ./order-service

# Build API Gateway (optional, we'll use Ingress)
docker build -t api-gateway:latest ./api-gateway
```

**Verify images:**
```bash
docker images | grep -E "user-service|product-service|order-service"
```

---

### Step 3: Install Nginx Ingress Controller

The Ingress Controller acts as the entry point for all traffic.

```bash
# Install Nginx Ingress Controller for Docker Desktop
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready (takes 1-2 minutes)
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

**Verify installation:**
```bash
kubectl get pods -n ingress-nginx
```

You should see the ingress controller pod running.

---

### Step 4: Create Kubernetes Namespace (Optional)

Organize resources in a dedicated namespace:

```bash
# Create namespace
kubectl create namespace product-order-system

# Set as default namespace (optional)
kubectl config set-context --current --namespace=product-order-system
```

Or use the default namespace (skip this step).

---

### Step 5: Deploy MongoDB Databases

Deploy StatefulSets for each database:

```bash
# Deploy MongoDB for User Service
kubectl apply -f k8s/mongodb-user-statefulset.yaml
kubectl apply -f k8s/mongodb-user-service.yaml

# Deploy MongoDB for Product Service
kubectl apply -f k8s/mongodb-product-statefulset.yaml
kubectl apply -f k8s/mongodb-product-service.yaml

# Deploy MongoDB for Order Service
kubectl apply -f k8s/mongodb-order-statefulset.yaml
kubectl apply -f k8s/mongodb-order-service.yaml
```

**Wait for MongoDB pods to be ready:**
```bash
kubectl get pods -w
# Press Ctrl+C when all MongoDB pods show "Running"
```

**Verify databases:**
```bash
kubectl get statefulsets
kubectl get pods | grep mongodb
```

---

### Step 6: Create ConfigMap and Secrets

```bash
# Create ConfigMap (non-sensitive configuration)
kubectl apply -f k8s/configmap.yaml

# Create Secret (database credentials)
kubectl apply -f k8s/secret.yaml
```

**Verify:**
```bash
kubectl get configmap
kubectl get secret
```

---

### Step 7: Deploy Microservices

Deploy each microservice with its Kubernetes Service:

```bash
# Deploy User Service
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/user-service-service.yaml

# Deploy Product Service
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/product-service-service.yaml

# Deploy Order Service
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/order-service-service.yaml
```

**Wait for services to be ready:**
```bash
kubectl get pods -w
# Wait until all pods show "Running" and "1/1" ready
```

**Verify deployments:**
```bash
kubectl get deployments
kubectl get services
kubectl get pods
```

---

### Step 8: Deploy Ingress

Deploy the Ingress resource to route traffic:

```bash
kubectl apply -f k8s/ingress.yaml
```

**Verify Ingress:**
```bash
kubectl get ingress
kubectl describe ingress product-order-ingress
```

---

### Step 9: Update Hosts File (Windows)

Add localhost mapping for easier access:

1. **Open Notepad as Administrator**
   - Search for "Notepad"
   - Right-click → "Run as administrator"

2. **Open hosts file**
   - File → Open
   - Navigate to: `C:\Windows\System32\drivers\etc\hosts`
   - Change file type to "All Files"
   - Open `hosts`

3. **Add this line:**
   ```
   127.0.0.1 product-order.local
   ```

4. **Save and close**

---

### Step 10: Test the System

#### Check All Pods are Running

```bash
kubectl get pods
```

All pods should show `Running` status and `1/1` ready.

#### Check Services

```bash
kubectl get services
```

You should see services for user, product, order, and MongoDB.

#### Check Ingress

```bash
kubectl get ingress
```

Should show the ingress with ADDRESS (localhost or 127.0.0.1).

#### Test Health Endpoints

```bash
# Test through Ingress
curl http://localhost/health/user
curl http://localhost/health/product
curl http://localhost/health/order
```

All should return `{"status":"healthy"}`

#### Test API Endpoints

```bash
# Create a user
curl -X POST http://localhost/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Create a product
curl -X POST http://localhost/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"stock":10}'

# List products
curl http://localhost/products

# Create an order (use IDs from above)
curl -X POST http://localhost/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","items":[{"productId":"PRODUCT_ID","quantity":2}]}'
```

---

## 🎮 Using the Web Dashboard

Update `test-api-gateway.html` to use localhost:

```javascript
const GATEWAY_URL = 'http://localhost';  // Changed from :8080
```

Then open `test-api-gateway.html` in your browser and test all endpoints!

---

## 🔍 Monitoring and Debugging

### View Logs

```bash
# View logs for specific pod
kubectl logs <pod-name>

# Follow logs in real-time
kubectl logs -f <pod-name>

# View logs for all pods of a deployment
kubectl logs -l app=user-service

# View previous container logs (if crashed)
kubectl logs <pod-name> --previous
```

### Describe Resources

```bash
# Get detailed info about a pod
kubectl describe pod <pod-name>

# Get detailed info about a service
kubectl describe service user-service

# Get detailed info about ingress
kubectl describe ingress product-order-ingress
```

### Execute Commands in Pods

```bash
# Open shell in a pod
kubectl exec -it <pod-name> -- sh

# Run a command in a pod
kubectl exec <pod-name> -- env

# Test connectivity between pods
kubectl exec <pod-name> -- curl http://user-service:3001/health
```

### Port Forwarding (Alternative Access)

```bash
# Forward local port to service
kubectl port-forward service/user-service 3001:3001

# Forward to specific pod
kubectl port-forward <pod-name> 3001:3001

# Then access at http://localhost:3001
```

### Using k9s (If Installed)

```bash
# Launch k9s
k9s

# Navigate with arrow keys
# Press '0' to show all namespaces
# Press 'd' to describe resource
# Press 'l' to view logs
# Press 'q' to quit
```

---

## 🛠️ Common Operations

### Scale Services

```bash
# Scale user service to 3 replicas
kubectl scale deployment user-service --replicas=3

# Verify
kubectl get pods | grep user-service
```

### Update Service

```bash
# After code changes, rebuild image
docker build -t user-service:latest ./user-service

# Restart deployment to use new image
kubectl rollout restart deployment user-service

# Check rollout status
kubectl rollout status deployment user-service
```

### View Resource Usage

```bash
# View resource usage
kubectl top nodes
kubectl top pods
```

### Access Kubernetes Dashboard (Optional)

```bash
# Deploy dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create admin user (for dashboard access)
# See: https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md

# Start proxy
kubectl proxy

# Access at:
# http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

## 🧹 Cleanup

### Delete All Resources

```bash
# Delete all deployments and services
kubectl delete -f k8s/

# Or delete specific resources
kubectl delete deployment user-service
kubectl delete service user-service

# Delete namespace (if created)
kubectl delete namespace product-order-system
```

### Stop Kubernetes

1. Open Docker Desktop Settings
2. Go to Kubernetes tab
3. Uncheck "Enable Kubernetes"
4. Click "Apply & Restart"

---

## 🐛 Troubleshooting

### Pods Not Starting

**Check pod status:**
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

**Common issues:**
- Image pull errors: Ensure images are built locally
- Resource limits: Increase Docker Desktop memory
- MongoDB not ready: Wait longer for databases to start

### Ingress Not Working

**Check ingress controller:**
```bash
kubectl get pods -n ingress-nginx
```

**Check ingress resource:**
```bash
kubectl describe ingress product-order-ingress
```

**Common issues:**
- Ingress controller not installed
- Wrong ingress class
- Services not ready

### Services Can't Communicate

**Test connectivity:**
```bash
# From one pod to another
kubectl exec <pod-name> -- curl http://user-service:3001/health
```

**Check service endpoints:**
```bash
kubectl get endpoints
```

### Database Connection Issues

**Check MongoDB pods:**
```bash
kubectl get pods | grep mongodb
kubectl logs <mongodb-pod-name>
```

**Test database connection:**
```bash
kubectl exec <service-pod> -- env | grep MONGO_URI
```

---

## 📊 Architecture Benefits You're Experiencing

### Service Discovery
- Services find each other by name (e.g., `http://user-service:3001`)
- No hardcoded IPs needed
- Kubernetes DNS handles resolution

### Load Balancing
- Kubernetes Services distribute traffic across pods
- Scale to multiple replicas for high availability

### Health Checks
- Liveness probes restart unhealthy pods
- Readiness probes prevent traffic to unready pods

### Configuration Management
- ConfigMaps for non-sensitive config
- Secrets for sensitive data (passwords, keys)

### Ingress Routing
- Single entry point (localhost)
- Path-based routing to services
- Can add TLS/HTTPS easily

### Self-Healing
- Pods automatically restart if they crash
- Deployments maintain desired replica count

---

## 🎓 Learning Resources

### Kubernetes Concepts

- **Pods**: Smallest deployable units
- **Deployments**: Manage pod replicas
- **Services**: Expose pods to network
- **StatefulSets**: For stateful apps (databases)
- **Ingress**: HTTP routing to services
- **ConfigMaps**: Configuration data
- **Secrets**: Sensitive data

### Useful Commands Cheat Sheet

```bash
# Get resources
kubectl get pods
kubectl get services
kubectl get deployments
kubectl get ingress

# Describe resources
kubectl describe pod <name>
kubectl describe service <name>

# Logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>

# Execute commands
kubectl exec -it <pod-name> -- sh

# Port forwarding
kubectl port-forward <pod-name> 8080:8080

# Scale
kubectl scale deployment <name> --replicas=3

# Delete
kubectl delete pod <name>
kubectl delete -f <file.yaml>

# Apply changes
kubectl apply -f <file.yaml>

# Restart deployment
kubectl rollout restart deployment <name>
```

---

## 🎉 Success Checklist

- [ ] Docker Desktop with Kubernetes enabled
- [ ] All Docker images built
- [ ] Nginx Ingress Controller installed
- [ ] MongoDB StatefulSets deployed and running
- [ ] ConfigMap and Secret created
- [ ] All microservices deployed and running
- [ ] Ingress resource created
- [ ] Health checks passing
- [ ] Can create users, products, and orders
- [ ] Web dashboard working

---

## 🚀 Next Steps

1. **Experiment with scaling:**
   ```bash
   kubectl scale deployment user-service --replicas=3
   ```

2. **Try rolling updates:**
   - Make code changes
   - Rebuild image
   - Restart deployment

3. **Monitor resources:**
   ```bash
   kubectl top pods
   ```

4. **Add monitoring:**
   - Install Prometheus
   - Install Grafana
   - Set up dashboards

5. **Deploy to cloud:**
   - AWS EKS
   - Google GKE
   - Azure AKS

---

**Congratulations! You're now running a complete microservices architecture with Kubernetes locally!** 🎉

You're experiencing:
- ✅ Container orchestration
- ✅ Service discovery
- ✅ Load balancing
- ✅ Ingress routing
- ✅ Health monitoring
- ✅ Self-healing
- ✅ Scalability

This is exactly how it works in production! 🚀
