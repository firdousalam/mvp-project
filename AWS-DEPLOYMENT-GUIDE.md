# AWS Deployment Guide - Product Order System

Complete guide for deploying the Product Order System microservices to AWS using ECS, ECR, and related services.

## Architecture Overview

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate Cluster
    ├── User Service (Task)
    ├── Product Service (Task)
    ├── Order Service (Task)
    └── API Gateway (Task)
    ↓
MongoDB Atlas (Database)
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally
- MongoDB Atlas account (from MONGODB-ATLAS-SETUP.md)
- Domain name (optional, for custom domain)

## AWS Services Used

- **ECS (Elastic Container Service)**: Container orchestration
- **ECR (Elastic Container Registry)**: Docker image storage
- **Fargate**: Serverless compute for containers
- **ALB (Application Load Balancer)**: Traffic distribution
- **VPC**: Network isolation
- **CloudWatch**: Logging and monitoring
- **IAM**: Access management
- **Systems Manager Parameter Store**: Secrets management

## Step-by-Step Deployment

### Step 1: Configure AWS CLI

```bash
# Install AWS CLI (if not already installed)
# Windows: Download from https://aws.amazon.com/cli/
# Linux/Mac: pip install awscli

# Configure AWS credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

### Step 2: Set Environment Variables

```bash
# Set your AWS region and account ID
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT_NAME=product-order-system

# For Windows PowerShell:
# $env:AWS_REGION="us-east-1"
# $env:AWS_ACCOUNT_ID=(aws sts get-caller-identity --query Account --output text)
# $env:PROJECT_NAME="product-order-system"
```

### Step 3: Create ECR Repositories

```bash
# Create ECR repositories for each service
aws ecr create-repository --repository-name ${PROJECT_NAME}/user-service --region ${AWS_REGION}
aws ecr create-repository --repository-name ${PROJECT_NAME}/product-service --region ${AWS_REGION}
aws ecr create-repository --repository-name ${PROJECT_NAME}/order-service --region ${AWS_REGION}
aws ecr create-repository --repository-name ${PROJECT_NAME}/api-gateway --region ${AWS_REGION}

# Get ECR login token and authenticate Docker
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

### Step 4: Build and Push Docker Images

```bash
# Build images
docker build -t user-service ./user-service
docker build -t product-service ./product-service
docker build -t order-service ./order-service
docker build -t api-gateway ./api-gateway

# Tag images for ECR
docker tag user-service:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/user-service:latest
docker tag product-service:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/product-service:latest
docker tag order-service:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/order-service:latest
docker tag api-gateway:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/api-gateway:latest

# Push images to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/user-service:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/product-service:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/order-service:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/api-gateway:latest
```

### Step 5: Store Secrets in AWS Systems Manager

```bash
# Store MongoDB Atlas connection strings (replace with your actual connection strings)
aws ssm put-parameter \
    --name "/${PROJECT_NAME}/user-service/mongo-uri" \
    --value "mongodb+srv://username:password@cluster.mongodb.net/user-db?retryWrites=true&w=majority" \
    --type "SecureString" \
    --region ${AWS_REGION}

aws ssm put-parameter \
    --name "/${PROJECT_NAME}/product-service/mongo-uri" \
    --value "mongodb+srv://username:password@cluster.mongodb.net/product-db?retryWrites=true&w=majority" \
    --type "SecureString" \
    --region ${AWS_REGION}

aws ssm put-parameter \
    --name "/${PROJECT_NAME}/order-service/mongo-uri" \
    --value "mongodb+srv://username:password@cluster.mongodb.net/order-db?retryWrites=true&w=majority" \
    --type "SecureString" \
    --region ${AWS_REGION}

# Store JWT secret for API Gateway
aws ssm put-parameter \
    --name "/${PROJECT_NAME}/api-gateway/jwt-secret" \
    --value "your-super-secret-jwt-key-change-this-in-production" \
    --type "SecureString" \
    --region ${AWS_REGION}
```

### Step 6: Create VPC and Networking (Optional - Use Default VPC)

If you want to use the default VPC, skip this step. Otherwise:

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=product-order-vpc}]'

# Create subnets (at least 2 for ALB)
# Create Internet Gateway
# Create Route Tables
# (Detailed VPC setup commands available in aws/vpc-setup.sh)
```

### Step 7: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
    --cluster-name ${PROJECT_NAME}-cluster \
    --region ${AWS_REGION}
```

### Step 8: Create IAM Roles

```bash
# Create ECS Task Execution Role (allows ECS to pull images and write logs)
aws iam create-role \
    --role-name ${PROJECT_NAME}-ecs-task-execution-role \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'

# Attach policies
aws iam attach-role-policy \
    --role-name ${PROJECT_NAME}-ecs-task-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
    --role-name ${PROJECT_NAME}-ecs-task-execution-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess

# Create ECS Task Role (allows containers to access AWS services)
aws iam create-role \
    --role-name ${PROJECT_NAME}-ecs-task-role \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'
```

### Step 9: Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/${PROJECT_NAME}/user-service --region ${AWS_REGION}
aws logs create-log-group --log-group-name /ecs/${PROJECT_NAME}/product-service --region ${AWS_REGION}
aws logs create-log-group --log-group-name /ecs/${PROJECT_NAME}/order-service --region ${AWS_REGION}
aws logs create-log-group --log-group-name /ecs/${PROJECT_NAME}/api-gateway --region ${AWS_REGION}
```

### Step 10: Create Security Groups

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# Create security group for ALB
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-alb-sg \
    --description "Security group for ALB" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow HTTP traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id ${ALB_SG_ID} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Create security group for ECS tasks
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-ecs-sg \
    --description "Security group for ECS tasks" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text)

# Allow traffic from ALB to ECS tasks
aws ec2 authorize-security-group-ingress \
    --group-id ${ECS_SG_ID} \
    --protocol tcp \
    --port 3001-3004 \
    --source-group ${ALB_SG_ID}
```

### Step 11: Create Application Load Balancer

```bash
# Get default subnets (need at least 2 in different AZs)
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[0:2].SubnetId" \
    --output text | tr '\t' ' ')

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${PROJECT_NAME}-alb \
    --subnets ${SUBNET_IDS} \
    --security-groups ${ALB_SG_ID} \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns ${ALB_ARN} \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "ALB DNS: ${ALB_DNS}"
```

### Step 12: Create Target Groups

```bash
# Create target groups for each service
USER_TG_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-user-tg \
    --protocol HTTP \
    --port 3001 \
    --vpc-id ${VPC_ID} \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

PRODUCT_TG_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-product-tg \
    --protocol HTTP \
    --port 3002 \
    --vpc-id ${VPC_ID} \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

ORDER_TG_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-order-tg \
    --protocol HTTP \
    --port 3003 \
    --vpc-id ${VPC_ID} \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

API_GW_TG_ARN=$(aws elbv2 create-target-group \
    --name ${PROJECT_NAME}-api-gw-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id ${VPC_ID} \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
```

### Step 13: Create ALB Listener and Rules

```bash
# Create listener
LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn ${ALB_ARN} \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=${API_GW_TG_ARN} \
    --query 'Listeners[0].ListenerArn' \
    --output text)

# Create rules for path-based routing (optional - if not using API Gateway)
# Route /users/* to user service
aws elbv2 create-rule \
    --listener-arn ${LISTENER_ARN} \
    --priority 1 \
    --conditions Field=path-pattern,Values='/users*' \
    --actions Type=forward,TargetGroupArn=${USER_TG_ARN}

# Route /products/* to product service
aws elbv2 create-rule \
    --listener-arn ${LISTENER_ARN} \
    --priority 2 \
    --conditions Field=path-pattern,Values='/products*' \
    --actions Type=forward,TargetGroupArn=${PRODUCT_TG_ARN}

# Route /orders/* to order service
aws elbv2 create-rule \
    --listener-arn ${LISTENER_ARN} \
    --priority 3 \
    --conditions Field=path-pattern,Values='/orders*' \
    --actions Type=forward,TargetGroupArn=${ORDER_TG_ARN}
```

### Step 14: Register ECS Task Definitions

See the `aws/` directory for complete task definition JSON files. Here's an example for user-service:

```bash
# Create task definition (see aws/task-definitions/ for complete files)
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/user-service.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/product-service.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/order-service.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/api-gateway.json
```

### Step 15: Create ECS Services

```bash
# Get subnet IDs for service placement
SUBNET_ID_1=$(echo ${SUBNET_IDS} | cut -d' ' -f1)
SUBNET_ID_2=$(echo ${SUBNET_IDS} | cut -d' ' -f2)

# Create User Service
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name user-service \
    --task-definition user-service \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID_1},${SUBNET_ID_2}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${USER_TG_ARN},containerName=user-service,containerPort=3001"

# Create Product Service
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name product-service \
    --task-definition product-service \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID_1},${SUBNET_ID_2}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${PRODUCT_TG_ARN},containerName=product-service,containerPort=3002"

# Create Order Service
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name order-service \
    --task-definition order-service \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID_1},${SUBNET_ID_2}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${ORDER_TG_ARN},containerName=order-service,containerPort=3003"

# Create API Gateway Service
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name api-gateway \
    --task-definition api-gateway \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID_1},${SUBNET_ID_2}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${API_GW_TG_ARN},containerName=api-gateway,containerPort=3000"
```

### Step 16: Verify Deployment

```bash
# Check service status
aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services user-service product-service order-service api-gateway

# Check running tasks
aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster

# Test the application
echo "Application URL: http://${ALB_DNS}"
curl http://${ALB_DNS}/health
```

## Monitoring and Logging

### View Logs in CloudWatch

```bash
# View logs for a service
aws logs tail /ecs/${PROJECT_NAME}/user-service --follow

# Or use AWS Console:
# CloudWatch → Log groups → /ecs/product-order-system/[service-name]
```

### Set Up CloudWatch Alarms

```bash
# Create alarm for high CPU usage
aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

## Scaling

### Manual Scaling

```bash
# Scale a service
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service user-service \
    --desired-count 4
```

### Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/${PROJECT_NAME}-cluster/user-service \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/${PROJECT_NAME}-cluster/user-service \
    --policy-name cpu-scaling-policy \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://aws/scaling-policy.json
```

## CI/CD with GitHub Actions

See `.github/workflows/aws-deploy.yml` for automated deployment pipeline.

## Cost Optimization

1. **Use Fargate Spot**: Save up to 70% on compute costs
2. **Right-size tasks**: Start with 0.25 vCPU / 512 MB RAM
3. **Use CloudWatch Logs retention**: Set to 7-30 days
4. **Enable Container Insights selectively**: Only for production
5. **Use NAT Gateway alternatives**: VPC endpoints for AWS services

## Estimated Monthly Costs

- **ECS Fargate** (4 services × 2 tasks × 0.25 vCPU): ~$50-70
- **Application Load Balancer**: ~$20-25
- **CloudWatch Logs** (with retention): ~$5-10
- **Data Transfer**: ~$10-20
- **MongoDB Atlas** (M10 cluster): ~$57
- **Total**: ~$142-182/month

## Troubleshooting

### Tasks Not Starting

```bash
# Check task stopped reason
aws ecs describe-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --tasks <task-id>

# Common issues:
# - Image pull errors: Check ECR permissions
# - Resource limits: Increase CPU/memory
# - Secrets access: Verify IAM role permissions
```

### Health Check Failures

```bash
# Check target health
aws elbv2 describe-target-health \
    --target-group-arn ${USER_TG_ARN}

# Common issues:
# - Security group blocking traffic
# - Health check path incorrect
# - Service not listening on correct port
```

### High Costs

```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=user-service \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Average
```

## Cleanup

To avoid ongoing charges, delete all resources:

```bash
# Delete ECS services
aws ecs update-service --cluster ${PROJECT_NAME}-cluster --service user-service --desired-count 0
aws ecs delete-service --cluster ${PROJECT_NAME}-cluster --service user-service --force

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn ${ALB_ARN}

# Delete target groups
aws elbv2 delete-target-group --target-group-arn ${USER_TG_ARN}

# Delete ECS cluster
aws ecs delete-cluster --cluster ${PROJECT_NAME}-cluster

# Delete ECR repositories
aws ecr delete-repository --repository-name ${PROJECT_NAME}/user-service --force

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /ecs/${PROJECT_NAME}/user-service

# Delete security groups
aws ec2 delete-security-group --group-id ${ECS_SG_ID}
aws ec2 delete-security-group --group-id ${ALB_SG_ID}

# Delete SSM parameters
aws ssm delete-parameter --name "/${PROJECT_NAME}/user-service/mongo-uri"
```

## Next Steps

1. **Set up custom domain**: Use Route 53 + ACM for HTTPS
2. **Enable WAF**: Add Web Application Firewall for security
3. **Set up CI/CD**: Automate deployments with GitHub Actions
4. **Add monitoring**: CloudWatch dashboards and alarms
5. **Implement backup**: Automated MongoDB Atlas backups
6. **Add caching**: ElastiCache for Redis

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [MongoDB Atlas AWS Integration](https://www.mongodb.com/cloud/atlas/aws)
