# Deployment Options - Product Order System

This document provides an overview of all available deployment options for the Product Order System.

## Quick Comparison

| Option | Best For | Setup Time | Cost | Complexity | Production Ready |
|--------|----------|------------|------|------------|------------------|
| **Local Development** | Development & Testing | 5 min | Free | ⭐ Easy | ❌ No |
| **Docker Compose** | Local Testing | 10 min | Free | ⭐⭐ Easy | ❌ No |
| **Kubernetes (Local)** | Learning K8s | 15 min | Free | ⭐⭐⭐ Medium | ⚠️ Partial |
| **AWS ECS** | Production | 15 min | ~$150/mo | ⭐⭐⭐⭐ Advanced | ✅ Yes |

## 1. Local Development

**Best for:** Active development, debugging, quick iterations

**Pros:**
- Fastest startup
- Easy debugging
- No containerization overhead
- Direct code changes

**Cons:**
- Manual service management
- No service discovery
- No load balancing
- Requires local MongoDB

**Setup:**
```bash
npm run start:local
```

**Documentation:** [SETUP-GUIDE.md](./SETUP-GUIDE.md)

---

## 2. Docker Compose (Local MongoDB)

**Best for:** Testing containerized services locally

**Pros:**
- Easy setup
- Isolated environments
- Includes MongoDB
- Service networking
- One command deployment

**Cons:**
- No orchestration
- No auto-scaling
- No load balancing
- Local only

**Setup:**
```bash
npm run docker:build
npm run docker:up
```

**Documentation:** [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)

---

## 3. Docker Compose (MongoDB Atlas)

**Best for:** Testing with cloud database

**Pros:**
- Cloud database (MongoDB Atlas)
- No local MongoDB needed
- Production-like database
- Easy setup
- Free tier available

**Cons:**
- Requires Atlas account
- Internet connection needed
- No orchestration
- No auto-scaling

**Setup:**
```bash
# 1. Setup MongoDB Atlas (see MONGODB-ATLAS-SETUP.md)
# 2. Create .env file with connection strings
npm run docker:atlas:build
npm run docker:atlas:up
```

**Documentation:** [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md)

---

## 4. Kubernetes (Local)

**Best for:** Learning Kubernetes, testing orchestration

**Pros:**
- Full Kubernetes experience
- Service discovery
- Ingress controller
- Load balancing
- Health checks
- Self-healing
- Scalability
- Production-like architecture

**Cons:**
- Requires Docker Desktop K8s
- More complex setup
- Higher resource usage
- Local only

**Setup:**
```bash
npm run k8s:deploy
```

**What you get:**
- Kubernetes cluster
- 3 microservices (2 replicas each)
- 3 MongoDB StatefulSets
- Nginx Ingress Controller
- ConfigMaps & Secrets
- Health checks & probes

**Documentation:** [KUBERNETES-LOCAL-SETUP.md](./KUBERNETES-LOCAL-SETUP.md)

---

## 5. AWS ECS (Production)

**Best for:** Production deployment, scalable applications

**Pros:**
- Production-ready
- Auto-scaling
- High availability (multi-AZ)
- Load balancing (ALB)
- CloudWatch monitoring
- Managed infrastructure
- CI/CD ready
- Security best practices
- No server management (Fargate)

**Cons:**
- Costs money (~$150/month)
- Requires AWS account
- More complex setup
- Requires MongoDB Atlas

**Setup:**
```bash
# 1. Setup infrastructure
npm run aws:setup

# 2. Deploy services
npm run aws:deploy
```

**What you get:**
- ECS Fargate cluster
- Application Load Balancer
- Auto-scaling policies
- CloudWatch logs & metrics
- IAM roles & policies
- Security groups
- Target groups
- ECR repositories

**Cost Breakdown:**
- ECS Fargate: ~$50-70/month
- ALB: ~$20-25/month
- CloudWatch: ~$5-10/month
- Data Transfer: ~$10-20/month
- MongoDB Atlas (M10): ~$57/month
- **Total: ~$142-182/month**

**Documentation:** 
- [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md) - Complete guide
- [AWS-QUICKSTART.md](./AWS-QUICKSTART.md) - 15-minute setup

---

## Decision Tree

```
Start Here
    |
    ├─ Need production deployment?
    │   └─ YES → AWS ECS
    │
    ├─ Want to learn Kubernetes?
    │   └─ YES → Kubernetes (Local)
    │
    ├─ Need cloud database?
    │   └─ YES → Docker Compose + Atlas
    │
    ├─ Just testing locally?
    │   └─ YES → Docker Compose (Local)
    │
    └─ Active development?
        └─ YES → Local Development
```

## Feature Comparison

| Feature | Local | Docker | K8s Local | AWS ECS |
|---------|-------|--------|-----------|---------|
| Service Discovery | ❌ | ✅ | ✅ | ✅ |
| Load Balancing | ❌ | ❌ | ✅ | ✅ |
| Auto-scaling | ❌ | ❌ | ⚠️ Manual | ✅ |
| Health Checks | ⚠️ Basic | ⚠️ Basic | ✅ | ✅ |
| Self-healing | ❌ | ❌ | ✅ | ✅ |
| Monitoring | ❌ | ⚠️ Logs | ⚠️ Basic | ✅ CloudWatch |
| High Availability | ❌ | ❌ | ⚠️ Limited | ✅ Multi-AZ |
| SSL/TLS | ❌ | ❌ | ⚠️ Manual | ✅ ACM |
| CI/CD Ready | ❌ | ⚠️ Partial | ⚠️ Partial | ✅ |
| Cost | Free | Free | Free | ~$150/mo |

## Recommended Path

### For Learning
1. Start with **Local Development** to understand the services
2. Move to **Docker Compose** to learn containerization
3. Try **Kubernetes (Local)** to learn orchestration
4. Deploy to **AWS ECS** for production experience

### For Production
1. Develop locally with **Local Development**
2. Test with **Docker Compose + Atlas**
3. Deploy to **AWS ECS** for production

### For Quick Demo
1. Use **Docker Compose** for fastest setup
2. Or **Kubernetes (Local)** for impressive demo

## Migration Between Options

### Local → Docker
```bash
# No changes needed, just build and run
npm run docker:build
npm run docker:up
```

### Docker → Kubernetes
```bash
# Deploy to K8s
npm run k8s:deploy
```

### Kubernetes → AWS
```bash
# Setup AWS infrastructure
npm run aws:setup

# Deploy to AWS
npm run aws:deploy
```

### Any → AWS
```bash
# Ensure you have MongoDB Atlas setup
# Then run AWS deployment
npm run aws:setup
npm run aws:deploy
```

## Testing Each Deployment

### Local Development
```bash
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
```

### Docker Compose
```bash
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8080/users   # Through Gateway
```

### Kubernetes
```bash
curl http://localhost/health/user     # Through Ingress
curl http://localhost/health/product
curl http://localhost/health/order
```

### AWS ECS
```bash
# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names product-order-system-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

curl http://${ALB_DNS}/health
curl http://${ALB_DNS}/users
```

## Support & Documentation

- **General Setup:** [START-HERE.md](./START-HERE.md)
- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Docker:** [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)
- **Kubernetes:** [KUBERNETES-LOCAL-SETUP.md](./KUBERNETES-LOCAL-SETUP.md)
- **AWS:** [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md)
- **MongoDB Atlas:** [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md)
- **API Documentation:** [user-service/API.md](./user-service/API.md)

## Next Steps

1. Choose your deployment option from the table above
2. Follow the corresponding documentation
3. Test the deployment using the test commands
4. Explore the API using `test-api-gateway.html`
5. Monitor your services using the provided tools

## Questions?

- Check the troubleshooting section in each guide
- Review the [FEATURES-SUMMARY.md](./FEATURES-SUMMARY.md)
- Look at the API documentation for each service
