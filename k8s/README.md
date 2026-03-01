# Kubernetes Configuration Files

This directory contains all Kubernetes manifests for deploying the Product Order System.

## 🔐 Security Note: secret.yaml

The `secret.yaml` file contains sensitive database credentials and is **gitignored** for security.

### Setup Instructions

1. **Copy the template:**
   ```bash
   cp secret.yaml.example secret.yaml
   ```

2. **Edit with your credentials:**
   - For local MongoDB: `mongodb://mongodb-user:27017/userdb`
   - For MongoDB Atlas: `mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/userdb`

3. **Apply to Kubernetes:**
   ```bash
   kubectl apply -f secret.yaml
   ```

### Important

- ✅ `secret.yaml.example` - Template file (safe to commit)
- ❌ `secret.yaml` - Your actual secrets (gitignored, never commit!)

## 📁 File Overview

### MongoDB StatefulSets
- `mongodb-user-statefulset.yaml` - User service database
- `mongodb-product-statefulset.yaml` - Product service database
- `mongodb-order-statefulset.yaml` - Order service database

### MongoDB Services
- `mongodb-user-service.yaml` - User DB service
- `mongodb-product-service.yaml` - Product DB service
- `mongodb-order-service.yaml` - Order DB service

### Application Deployments
- `user-service-deployment.yaml` - User service deployment
- `product-service-deployment.yaml` - Product service deployment
- `order-service-deployment.yaml` - Order service deployment

### Application Services
- `user-service-service.yaml` - User service exposure
- `product-service-service.yaml` - Product service exposure
- `order-service-service.yaml` - Order service exposure

### Configuration
- `configmap.yaml` - Non-sensitive configuration
- `secret.yaml` - Sensitive credentials (gitignored)
- `secret.yaml.example` - Template for secrets

### Ingress
- `ingress.yaml` - Nginx ingress configuration for routing

## 🚀 Quick Deploy

```bash
# 1. Setup your secrets
cp secret.yaml.example secret.yaml
# Edit secret.yaml with your credentials

# 2. Deploy everything
kubectl apply -f .

# 3. Check status
kubectl get pods
kubectl get services
kubectl get ingress
```

## 📚 Documentation

For complete setup instructions, see:
- [Kubernetes Local Setup Guide](../docs/kubernetes/KUBERNETES-LOCAL-SETUP.md)
- [Kubernetes Success Guide](../docs/kubernetes/KUBERNETES-SUCCESS.md)
- [Troubleshooting Guide](../docs/kubernetes/KUBERNETES-TROUBLESHOOTING.md)
