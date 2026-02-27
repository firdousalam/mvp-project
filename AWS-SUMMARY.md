# AWS Deployment Summary

Complete AWS deployment setup for the Product Order System microservices.

## 📁 Files Created

### Documentation
- **AWS-DEPLOYMENT-GUIDE.md** - Complete 16-step deployment guide with all AWS services
- **AWS-QUICKSTART.md** - 15-minute quick start guide
- **AWS-SUMMARY.md** - This file
- **DEPLOYMENT-OPTIONS.md** - Comparison of all deployment options

### AWS Configuration Files
- **aws/task-definitions/user-service.json** - ECS task definition for User Service
- **aws/task-definitions/product-service.json** - ECS task definition for Product Service
- **aws/task-definitions/order-service.json** - ECS task definition for Order Service
- **aws/task-definitions/api-gateway.json** - ECS task definition for API Gateway
- **aws/scaling-policy.json** - Auto-scaling configuration

### Deployment Scripts
- **aws/setup-aws-infrastructure.sh** - One-time infrastructure setup (Bash)
- **aws/deploy-to-aws.sh** - Deploy services to AWS (Bash)
- **aws/deploy-to-aws.ps1** - Deploy services to AWS (PowerShell)

### CI/CD
- **.github/workflows/aws-deploy.yml** - GitHub Actions workflow for automated deployment

## 🏗️ Architecture

```
Internet
    ↓
Application Load Balancer (ALB)
    ├─ Target Group: API Gateway (Port 3000)
    ├─ Target Group: User Service (Port 3001)
    ├─ Target Group: Product Service (Port 3002)
    └─ Target Group: Order Service (Port 3003)
    ↓
ECS Fargate Cluster
    ├─ API Gateway Service (2 tasks)
    ├─ User Service (2 tasks)
    ├─ Product Service (2 tasks)
    └─ Order Service (2 tasks)
    ↓
MongoDB Atlas (Cloud Database)
    ├─ user-db
    ├─ product-db
    └─ order-db
```

## 🚀 Quick Start

### Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed
4. MongoDB Atlas account

### Setup (One-time)
```bash
# 1. Configure AWS CLI
aws configure

# 2. Setup infrastructure
chmod +x aws/setup-aws-infrastructure.sh
./aws/setup-aws-infrastructure.sh
```

### Deploy
```bash
# Deploy all services
chmod +x aws/deploy-to-aws.sh
./aws/deploy-to-aws.sh
```

### Test
```bash
# Get application URL
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names product-order-system-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test endpoints
curl http://${ALB_DNS}/health
curl http://${ALB_DNS}/users
```

## 📊 AWS Services Used

| Service | Purpose | Cost/Month |
|---------|---------|------------|
| **ECS Fargate** | Container orchestration | ~$50-70 |
| **ECR** | Docker image registry | ~$1-2 |
| **ALB** | Load balancing | ~$20-25 |
| **CloudWatch** | Logging & monitoring | ~$5-10 |
| **Systems Manager** | Secrets management | Free |
| **IAM** | Access control | Free |
| **VPC** | Networking | Free |
| **Data Transfer** | Network egress | ~$10-20 |
| **MongoDB Atlas** | Database (M10) | ~$57 |
| **Total** | | **~$142-182** |

## 🔧 NPM Scripts

Added to `package.json`:

```json
{
  "aws:setup": "bash aws/setup-aws-infrastructure.sh",
  "aws:deploy": "bash aws/deploy-to-aws.sh",
  "aws:status": "aws ecs describe-services --cluster product-order-system-cluster --services user-service product-service order-service api-gateway",
  "aws:logs": "aws logs tail /ecs/product-order-system/user-service --follow"
}
```

Usage:
```bash
npm run aws:setup    # One-time infrastructure setup
npm run aws:deploy   # Deploy/update services
npm run aws:status   # Check service status
npm run aws:logs     # View logs
```

## 📝 Task Definitions

Each service has a task definition with:
- **CPU:** 256 (0.25 vCPU)
- **Memory:** 512 MB
- **Network Mode:** awsvpc
- **Launch Type:** Fargate
- **Health Check:** HTTP GET /health every 30s
- **Logging:** CloudWatch Logs
- **Secrets:** AWS Systems Manager Parameter Store

## 🔐 Security

### IAM Roles
- **Task Execution Role:** Allows ECS to pull images and write logs
  - AmazonECSTaskExecutionRolePolicy
  - AmazonSSMReadOnlyAccess

- **Task Role:** Allows containers to access AWS services

### Security Groups
- **ALB Security Group:** Allows HTTP (port 80) from internet
- **ECS Security Group:** Allows traffic from ALB on ports 3000-3003

### Secrets Management
All sensitive data stored in AWS Systems Manager Parameter Store:
- MongoDB connection strings (SecureString)
- JWT secrets (SecureString)

## 📈 Monitoring

### CloudWatch Logs
- `/ecs/product-order-system/user-service`
- `/ecs/product-order-system/product-service`
- `/ecs/product-order-system/order-service`
- `/ecs/product-order-system/api-gateway`

### Metrics
- CPU Utilization
- Memory Utilization
- Request Count
- Target Response Time
- Healthy/Unhealthy Host Count

### Alarms (Optional)
- High CPU usage (>80%)
- High memory usage (>80%)
- Unhealthy targets
- 5xx errors

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/aws-deploy.yml`):

**Triggers:**
- Push to `main` or `production` branch
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Configure AWS credentials
3. Login to ECR
4. Build Docker images
5. Push to ECR
6. Register task definitions
7. Update ECS services
8. Wait for deployment to stabilize

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 📊 Scaling

### Manual Scaling
```bash
aws ecs update-service \
  --cluster product-order-system-cluster \
  --service user-service \
  --desired-count 4
```

### Auto Scaling
Configured in `aws/scaling-policy.json`:
- **Target:** 70% CPU utilization
- **Scale Out Cooldown:** 60 seconds
- **Scale In Cooldown:** 300 seconds
- **Min Capacity:** 2 tasks
- **Max Capacity:** 10 tasks

## 🧹 Cleanup

To delete all AWS resources:

```bash
# Delete services
aws ecs update-service --cluster product-order-system-cluster --service user-service --desired-count 0
aws ecs delete-service --cluster product-order-system-cluster --service user-service --force
# Repeat for other services...

# Delete ALB and target groups
aws elbv2 delete-load-balancer --load-balancer-arn <ALB_ARN>
aws elbv2 delete-target-group --target-group-arn <TG_ARN>

# Delete ECS cluster
aws ecs delete-cluster --cluster product-order-system-cluster

# Delete ECR repositories
aws ecr delete-repository --repository-name product-order-system/user-service --force
# Repeat for other repositories...

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /ecs/product-order-system/user-service
# Repeat for other log groups...

# Delete security groups
aws ec2 delete-security-group --group-id <SG_ID>

# Delete SSM parameters
aws ssm delete-parameter --name /product-order-system/user-service/mongo-uri
# Repeat for other parameters...
```

## 🎯 Key Features

✅ **Serverless Containers** - No EC2 instances to manage
✅ **Auto-scaling** - Scales based on CPU utilization
✅ **High Availability** - Multi-AZ deployment
✅ **Load Balancing** - Application Load Balancer
✅ **Service Discovery** - Built-in with ECS
✅ **Health Checks** - Automatic health monitoring
✅ **Logging** - Centralized CloudWatch logs
✅ **Secrets Management** - AWS Systems Manager
✅ **CI/CD Ready** - GitHub Actions workflow
✅ **Cost Optimized** - Right-sized resources

## 🔍 Troubleshooting

### Tasks Not Starting
```bash
# Check task stopped reason
aws ecs describe-tasks --cluster product-order-system-cluster --tasks <task-id>
```

Common issues:
- Image pull errors → Check ECR permissions
- Resource limits → Increase CPU/memory
- Secrets access → Verify IAM role

### Health Check Failures
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn <TG_ARN>
```

Common issues:
- Security group blocking traffic
- Service not ready (wait 2-3 minutes)
- MongoDB connection issues

### High Costs
- Use Fargate Spot (save 70%)
- Right-size tasks (start with 0.25 vCPU)
- Set log retention (7-30 days)
- Scale down during off-hours

## 📚 Documentation

- **[AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md)** - Complete deployment guide
- **[AWS-QUICKSTART.md](./AWS-QUICKSTART.md)** - 15-minute quick start
- **[DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md)** - Compare all deployment options
- **[MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md)** - Database setup

## 🎓 What You've Learned

By deploying to AWS, you've gained experience with:
- Container orchestration with ECS
- Serverless compute with Fargate
- Load balancing with ALB
- Container registry with ECR
- Logging with CloudWatch
- Secrets management with Systems Manager
- Infrastructure as Code
- CI/CD with GitHub Actions
- Production deployment best practices

## 🚀 Next Steps

1. **Add custom domain** - Route 53 + ACM for HTTPS
2. **Enable WAF** - Web Application Firewall
3. **Add caching** - ElastiCache for Redis
4. **Setup monitoring** - CloudWatch dashboards
5. **Implement backups** - MongoDB Atlas automated backups
6. **Add CDN** - CloudFront for static assets
7. **Enable Container Insights** - Advanced monitoring

## 💡 Tips

- Start with small task sizes (0.25 vCPU / 512 MB)
- Use Fargate Spot for non-critical workloads
- Set CloudWatch log retention to avoid costs
- Enable auto-scaling for production
- Use CI/CD for consistent deployments
- Monitor costs with AWS Cost Explorer
- Tag all resources for cost tracking

## 📞 Support

For issues or questions:
1. Check troubleshooting section in AWS-DEPLOYMENT-GUIDE.md
2. Review CloudWatch logs
3. Check AWS service health dashboard
4. Verify MongoDB Atlas connectivity

---

**Congratulations!** 🎉 You now have a production-ready microservices application running on AWS!
