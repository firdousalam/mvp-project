# AWS Quick Start - 15 Minutes to Production

Deploy the Product Order System to AWS ECS in 15 minutes!

## Prerequisites

- AWS Account ([Create one here](https://aws.amazon.com/free/))
- AWS CLI installed ([Installation guide](https://aws.amazon.com/cli/))
- Docker installed and running
- MongoDB Atlas account ([Setup guide](./MONGODB-ATLAS-SETUP.md))

## Step 1: Configure AWS CLI (2 minutes)

```bash
# Configure AWS credentials
aws configure

# You'll need:
# - AWS Access Key ID (from IAM console)
# - AWS Secret Access Key (from IAM console)
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

## Step 2: Setup MongoDB Atlas (5 minutes)

Follow [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md) to:
1. Create a free MongoDB Atlas cluster
2. Get connection strings for all three databases
3. Whitelist AWS IP ranges (0.0.0.0/0 for testing)

## Step 3: Setup AWS Infrastructure (5 minutes)

```bash
# Make script executable (Linux/Mac)
chmod +x aws/setup-aws-infrastructure.sh

# Run infrastructure setup
./aws/setup-aws-infrastructure.sh

# For Windows PowerShell:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\aws\setup-aws-infrastructure.ps1
```

This script will:
- Create ECR repositories
- Store MongoDB credentials in AWS Systems Manager
- Create IAM roles
- Setup VPC and security groups
- Create Application Load Balancer
- Create target groups

**You'll be prompted for:**
- User Service MongoDB URI
- Product Service MongoDB URI
- Order Service MongoDB URI
- JWT Secret (any random string)

## Step 4: Deploy Services (3 minutes)

```bash
# Make script executable (Linux/Mac)
chmod +x aws/deploy-to-aws.sh

# Deploy all services
./aws/deploy-to-aws.sh

# For Windows PowerShell:
# .\aws\deploy-to-aws.ps1
```

This script will:
- Build Docker images
- Push images to ECR
- Create ECS cluster
- Register task definitions
- Deploy services to ECS

## Step 5: Test Your Deployment

```bash
# Get your application URL
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names product-order-system-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "Your application is available at: http://${ALB_DNS}"

# Test health endpoints
curl http://${ALB_DNS}/health
curl http://${ALB_DNS}/users
curl http://${ALB_DNS}/products
curl http://${ALB_DNS}/orders

# Create a test user
curl -X POST http://${ALB_DNS}/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## What You've Deployed

```
Internet
    ↓
Application Load Balancer
    ↓
┌─────────────────────────────────────┐
│        ECS Fargate Cluster          │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │  User    │  │ Product  │       │
│  │ Service  │  │ Service  │       │
│  │ (x2)     │  │ (x2)     │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │  Order   │  │   API    │       │
│  │ Service  │  │ Gateway  │       │
│  │ (x2)     │  │ (x2)     │       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
    ↓
MongoDB Atlas (Cloud Database)
```

## Monitoring

### View Logs

```bash
# View logs for a service
aws logs tail /ecs/product-order-system/user-service --follow

# Or use AWS Console:
# CloudWatch → Log groups → /ecs/product-order-system/[service-name]
```

### Check Service Status

```bash
# List all services
aws ecs list-services --cluster product-order-system-cluster

# Describe services
aws ecs describe-services \
  --cluster product-order-system-cluster \
  --services user-service product-service order-service api-gateway
```

### View Running Tasks

```bash
# List tasks
aws ecs list-tasks --cluster product-order-system-cluster

# Get task details
aws ecs describe-tasks \
  --cluster product-order-system-cluster \
  --tasks <task-id>
```

## Scaling

### Manual Scaling

```bash
# Scale user service to 4 instances
aws ecs update-service \
  --cluster product-order-system-cluster \
  --service user-service \
  --desired-count 4
```

### Auto Scaling (Optional)

See [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md#scaling) for auto-scaling setup.

## Cost Management

### Current Setup Costs (Estimated)

- **ECS Fargate** (8 tasks × 0.25 vCPU × 0.5 GB): ~$50-70/month
- **Application Load Balancer**: ~$20-25/month
- **CloudWatch Logs**: ~$5-10/month
- **Data Transfer**: ~$10-20/month
- **MongoDB Atlas** (M10): ~$57/month
- **Total**: ~$142-182/month

### Cost Optimization Tips

1. **Use Fargate Spot** (save up to 70%):
   ```bash
   # Update service to use Spot
   aws ecs update-service \
     --cluster product-order-system-cluster \
     --service user-service \
     --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
   ```

2. **Right-size your tasks**: Start with 0.25 vCPU / 512 MB RAM

3. **Set CloudWatch log retention**:
   ```bash
   aws logs put-retention-policy \
     --log-group-name /ecs/product-order-system/user-service \
     --retention-in-days 7
   ```

4. **Scale down during off-hours**: Use scheduled scaling

## CI/CD Setup (Optional)

### GitHub Actions

1. Add secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Push to main branch to trigger automatic deployment

See `.github/workflows/aws-deploy.yml` for the workflow configuration.

## Cleanup (To Avoid Charges)

```bash
# Delete ECS services
aws ecs update-service --cluster product-order-system-cluster --service user-service --desired-count 0
aws ecs delete-service --cluster product-order-system-cluster --service user-service --force

# Repeat for other services...

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn <ALB_ARN>

# Delete target groups
aws elbv2 delete-target-group --target-group-arn <TG_ARN>

# Delete ECS cluster
aws ecs delete-cluster --cluster product-order-system-cluster

# Delete ECR repositories
aws ecr delete-repository --repository-name product-order-system/user-service --force
aws ecr delete-repository --repository-name product-order-system/product-service --force
aws ecr delete-repository --repository-name product-order-system/order-service --force
aws ecr delete-repository --repository-name product-order-system/api-gateway --force

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /ecs/product-order-system/user-service
aws logs delete-log-group --log-group-name /ecs/product-order-system/product-service
aws logs delete-log-group --log-group-name /ecs/product-order-system/order-service
aws logs delete-log-group --log-group-name /ecs/product-order-system/api-gateway

# Delete security groups
aws ec2 delete-security-group --group-id <ECS_SG_ID>
aws ec2 delete-security-group --group-id <ALB_SG_ID>

# Delete SSM parameters
aws ssm delete-parameter --name /product-order-system/user-service/mongo-uri
aws ssm delete-parameter --name /product-order-system/product-service/mongo-uri
aws ssm delete-parameter --name /product-order-system/order-service/mongo-uri
aws ssm delete-parameter --name /product-order-system/api-gateway/jwt-secret
```

## Troubleshooting

### Tasks Not Starting

```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster product-order-system-cluster \
  --tasks <task-id>

# Common issues:
# - Image pull errors: Check ECR permissions
# - Resource limits: Increase CPU/memory in task definition
# - Secrets access: Verify IAM role has SSM permissions
```

### Health Check Failures

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <TG_ARN>

# Common issues:
# - Security group blocking traffic
# - Service not ready (wait 2-3 minutes)
# - MongoDB connection issues
```

### Cannot Access Application

1. Check ALB DNS is correct
2. Verify security groups allow HTTP (port 80)
3. Check service is running: `aws ecs describe-services`
4. Check target health: `aws elbv2 describe-target-health`

## Next Steps

1. **Add custom domain**: Use Route 53 + ACM for HTTPS
2. **Enable monitoring**: CloudWatch dashboards and alarms
3. **Setup backups**: MongoDB Atlas automated backups
4. **Add caching**: ElastiCache for Redis
5. **Implement WAF**: Web Application Firewall for security

## Additional Resources

- [Complete AWS Deployment Guide](./AWS-DEPLOYMENT-GUIDE.md)
- [MongoDB Atlas Setup](./MONGODB-ATLAS-SETUP.md)
- [API Documentation](./user-service/API.md)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

## Support

For issues or questions:
1. Check [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md) troubleshooting section
2. Review CloudWatch logs
3. Check AWS service health dashboard
