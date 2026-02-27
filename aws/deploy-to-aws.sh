#!/bin/bash

# AWS Deployment Script for Product Order System
# This script automates the deployment of all microservices to AWS ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
export AWS_REGION=${AWS_REGION:-us-east-1}
export PROJECT_NAME="product-order-system"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Deployment - Product Order System${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Get AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ AWS Region: ${AWS_REGION}${NC}"

# Step 1: Create ECR Repositories
echo -e "\n${YELLOW}Step 1: Creating ECR repositories...${NC}"
for service in user-service product-service order-service api-gateway; do
    if aws ecr describe-repositories --repository-names ${PROJECT_NAME}/${service} --region ${AWS_REGION} 2>/dev/null; then
        echo -e "${GREEN}✓ Repository ${service} already exists${NC}"
    else
        aws ecr create-repository --repository-name ${PROJECT_NAME}/${service} --region ${AWS_REGION}
        echo -e "${GREEN}✓ Created repository ${service}${NC}"
    fi
done

# Step 2: Build and Push Docker Images
echo -e "\n${YELLOW}Step 2: Building and pushing Docker images...${NC}"

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

for service in user-service product-service order-service api-gateway; do
    echo -e "${YELLOW}Building ${service}...${NC}"
    docker build -t ${service} ./${service}
    
    echo -e "${YELLOW}Tagging ${service}...${NC}"
    docker tag ${service}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/${service}:latest
    
    echo -e "${YELLOW}Pushing ${service}...${NC}"
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/${service}:latest
    
    echo -e "${GREEN}✓ ${service} deployed to ECR${NC}"
done

# Step 3: Create ECS Cluster
echo -e "\n${YELLOW}Step 3: Creating ECS cluster...${NC}"
if aws ecs describe-clusters --clusters ${PROJECT_NAME}-cluster --region ${AWS_REGION} --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    echo -e "${GREEN}✓ Cluster already exists${NC}"
else
    aws ecs create-cluster --cluster-name ${PROJECT_NAME}-cluster --region ${AWS_REGION}
    echo -e "${GREEN}✓ Created ECS cluster${NC}"
fi

# Step 4: Create CloudWatch Log Groups
echo -e "\n${YELLOW}Step 4: Creating CloudWatch log groups...${NC}"
for service in user-service product-service order-service api-gateway; do
    if aws logs describe-log-groups --log-group-name-prefix /ecs/${PROJECT_NAME}/${service} --region ${AWS_REGION} --query 'logGroups[0]' 2>/dev/null | grep -q "logGroupName"; then
        echo -e "${GREEN}✓ Log group for ${service} already exists${NC}"
    else
        aws logs create-log-group --log-group-name /ecs/${PROJECT_NAME}/${service} --region ${AWS_REGION}
        echo -e "${GREEN}✓ Created log group for ${service}${NC}"
    fi
done

# Step 5: Register Task Definitions
echo -e "\n${YELLOW}Step 5: Registering ECS task definitions...${NC}"
for service in user-service product-service order-service api-gateway; do
    # Replace placeholders in task definition
    sed -e "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" \
        -e "s/\${AWS_REGION}/${AWS_REGION}/g" \
        aws/task-definitions/${service}.json > /tmp/${service}-task-def.json
    
    aws ecs register-task-definition --cli-input-json file:///tmp/${service}-task-def.json --region ${AWS_REGION}
    echo -e "${GREEN}✓ Registered task definition for ${service}${NC}"
done

# Step 6: Update or Create Services
echo -e "\n${YELLOW}Step 6: Updating ECS services...${NC}"
echo -e "${YELLOW}Note: This assumes you have already created the ALB, target groups, and security groups${NC}"
echo -e "${YELLOW}If not, please run the manual setup steps from AWS-DEPLOYMENT-GUIDE.md first${NC}"

read -p "Have you completed the ALB and networking setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please complete the networking setup and run this script again${NC}"
    exit 0
fi

# Get VPC and subnet information
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region ${AWS_REGION})
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[0:2].SubnetId" --output text --region ${AWS_REGION} | tr '\t' ',')
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" --query "SecurityGroups[0].GroupId" --output text --region ${AWS_REGION})

echo -e "${GREEN}✓ VPC ID: ${VPC_ID}${NC}"
echo -e "${GREEN}✓ Subnets: ${SUBNET_IDS}${NC}"
echo -e "${GREEN}✓ Security Group: ${ECS_SG_ID}${NC}"

# Update services (force new deployment)
for service in user-service product-service order-service api-gateway; do
    if aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${service} --region ${AWS_REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
        echo -e "${YELLOW}Updating ${service}...${NC}"
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-cluster \
            --service ${service} \
            --force-new-deployment \
            --region ${AWS_REGION}
        echo -e "${GREEN}✓ Updated ${service}${NC}"
    else
        echo -e "${YELLOW}Service ${service} not found. Please create it manually using the guide.${NC}"
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Check service status: aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services user-service"
echo -e "2. View logs: aws logs tail /ecs/${PROJECT_NAME}/user-service --follow"
echo -e "3. Get ALB DNS: aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --query 'LoadBalancers[0].DNSName' --output text"
echo -e "4. Test the API: curl http://\$(aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --query 'LoadBalancers[0].DNSName' --output text)/health"
