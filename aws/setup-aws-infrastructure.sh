#!/bin/bash

# AWS Infrastructure Setup Script
# This script sets up the complete AWS infrastructure for the Product Order System

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
export AWS_REGION=${AWS_REGION:-us-east-1}
export PROJECT_NAME="product-order-system"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Get AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ AWS Region: ${AWS_REGION}${NC}"

# Prompt for MongoDB Atlas connection strings
echo -e "\n${YELLOW}MongoDB Atlas Configuration${NC}"
echo -e "Please enter your MongoDB Atlas connection strings:"
read -p "User Service MongoDB URI: " USER_MONGO_URI
read -p "Product Service MongoDB URI: " PRODUCT_MONGO_URI
read -p "Order Service MongoDB URI: " ORDER_MONGO_URI
read -p "JWT Secret (for API Gateway): " JWT_SECRET

# Store secrets in AWS Systems Manager
echo -e "\n${YELLOW}Storing secrets in AWS Systems Manager...${NC}"
aws ssm put-parameter \
    --name "/${PROJECT_NAME}/user-service/mongo-uri" \
    --value "${USER_MONGO_URI}" \
    --type "SecureString" \
    --region ${AWS_REGION} \
    --overwrite
echo -e "${GREEN}✓ Stored User Service MongoDB URI${NC}"

aws ssm put-parameter \
    --name "/${PROJECT_NAME}/product-service/mongo-uri" \
    --value "${PRODUCT_MONGO_URI}" \
    --type "SecureString" \
    --region ${AWS_REGION} \
    --overwrite
echo -e "${GREEN}✓ Stored Product Service MongoDB URI${NC}"

aws ssm put-parameter \
    --name "/${PROJECT_NAME}/order-service/mongo-uri" \
    --value "${ORDER_MONGO_URI}" \
    --type "SecureString" \
    --region ${AWS_REGION} \
    --overwrite
echo -e "${GREEN}✓ Stored Order Service MongoDB URI${NC}"

aws ssm put-parameter \
    --name "/${PROJECT_NAME}/api-gateway/jwt-secret" \
    --value "${JWT_SECRET}" \
    --type "SecureString" \
    --region ${AWS_REGION} \
    --overwrite
echo -e "${GREEN}✓ Stored JWT Secret${NC}"

# Create IAM roles
echo -e "\n${YELLOW}Creating IAM roles...${NC}"

# ECS Task Execution Role
if aws iam get-role --role-name ${PROJECT_NAME}-ecs-task-execution-role 2>/dev/null; then
    echo -e "${GREEN}✓ Task execution role already exists${NC}"
else
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
    
    aws iam attach-role-policy \
        --role-name ${PROJECT_NAME}-ecs-task-execution-role \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    aws iam attach-role-policy \
        --role-name ${PROJECT_NAME}-ecs-task-execution-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess
    
    echo -e "${GREEN}✓ Created task execution role${NC}"
fi

# ECS Task Role
if aws iam get-role --role-name ${PROJECT_NAME}-ecs-task-role 2>/dev/null; then
    echo -e "${GREEN}✓ Task role already exists${NC}"
else
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
    echo -e "${GREEN}✓ Created task role${NC}"
fi

# Get VPC information
echo -e "\n${YELLOW}Setting up networking...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region ${AWS_REGION})
echo -e "${GREEN}✓ Using VPC: ${VPC_ID}${NC}"

# Create security groups
echo -e "\n${YELLOW}Creating security groups...${NC}"

# ALB Security Group
if aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" --region ${AWS_REGION} 2>/dev/null | grep -q "GroupId"; then
    ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" --query "SecurityGroups[0].GroupId" --output text --region ${AWS_REGION})
    echo -e "${GREEN}✓ ALB security group already exists: ${ALB_SG_ID}${NC}"
else
    ALB_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-alb-sg \
        --description "Security group for ALB" \
        --vpc-id ${VPC_ID} \
        --query 'GroupId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 authorize-security-group-ingress \
        --group-id ${ALB_SG_ID} \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ Created ALB security group: ${ALB_SG_ID}${NC}"
fi

# ECS Security Group
if aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" --region ${AWS_REGION} 2>/dev/null | grep -q "GroupId"; then
    ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" --query "SecurityGroups[0].GroupId" --output text --region ${AWS_REGION})
    echo -e "${GREEN}✓ ECS security group already exists: ${ECS_SG_ID}${NC}"
else
    ECS_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-ecs-sg \
        --description "Security group for ECS tasks" \
        --vpc-id ${VPC_ID} \
        --query 'GroupId' \
        --output text \
        --region ${AWS_REGION})
    
    aws ec2 authorize-security-group-ingress \
        --group-id ${ECS_SG_ID} \
        --protocol tcp \
        --port 3000-3003 \
        --source-group ${ALB_SG_ID} \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ Created ECS security group: ${ECS_SG_ID}${NC}"
fi

# Create Application Load Balancer
echo -e "\n${YELLOW}Creating Application Load Balancer...${NC}"
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[0:2].SubnetId" --output text --region ${AWS_REGION} | tr '\t' ' ')

if aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --region ${AWS_REGION} 2>/dev/null | grep -q "LoadBalancerArn"; then
    ALB_ARN=$(aws elbv2 describe-load-balancers --names ${PROJECT_NAME}-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text --region ${AWS_REGION})
    echo -e "${GREEN}✓ ALB already exists${NC}"
else
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ${PROJECT_NAME}-alb \
        --subnets ${SUBNET_IDS} \
        --security-groups ${ALB_SG_ID} \
        --scheme internet-facing \
        --type application \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region ${AWS_REGION})
    echo -e "${GREEN}✓ Created ALB${NC}"
fi

ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns ${ALB_ARN} --query 'LoadBalancers[0].DNSName' --output text --region ${AWS_REGION})
echo -e "${GREEN}✓ ALB DNS: ${ALB_DNS}${NC}"

# Create Target Groups
echo -e "\n${YELLOW}Creating target groups...${NC}"

declare -A TARGET_GROUPS=(
    ["user"]="3001"
    ["product"]="3002"
    ["order"]="3003"
    ["api-gw"]="3000"
)

for service in "${!TARGET_GROUPS[@]}"; do
    port=${TARGET_GROUPS[$service]}
    tg_name="${PROJECT_NAME}-${service}-tg"
    
    if aws elbv2 describe-target-groups --names ${tg_name} --region ${AWS_REGION} 2>/dev/null | grep -q "TargetGroupArn"; then
        echo -e "${GREEN}✓ Target group ${service} already exists${NC}"
    else
        aws elbv2 create-target-group \
            --name ${tg_name} \
            --protocol HTTP \
            --port ${port} \
            --vpc-id ${VPC_ID} \
            --target-type ip \
            --health-check-path /health \
            --region ${AWS_REGION}
        echo -e "${GREEN}✓ Created target group ${service}${NC}"
    fi
done

# Create ALB Listener
echo -e "\n${YELLOW}Creating ALB listener...${NC}"
API_GW_TG_ARN=$(aws elbv2 describe-target-groups --names ${PROJECT_NAME}-api-gw-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region ${AWS_REGION})

if aws elbv2 describe-listeners --load-balancer-arn ${ALB_ARN} --region ${AWS_REGION} 2>/dev/null | grep -q "ListenerArn"; then
    echo -e "${GREEN}✓ Listener already exists${NC}"
else
    aws elbv2 create-listener \
        --load-balancer-arn ${ALB_ARN} \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=${API_GW_TG_ARN} \
        --region ${AWS_REGION}
    echo -e "${GREEN}✓ Created listener${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Infrastructure Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Run: ./aws/deploy-to-aws.sh"
echo -e "2. Access your application at: http://${ALB_DNS}"
echo -e "\n${YELLOW}Save these values:${NC}"
echo -e "VPC_ID=${VPC_ID}"
echo -e "ALB_SG_ID=${ALB_SG_ID}"
echo -e "ECS_SG_ID=${ECS_SG_ID}"
echo -e "ALB_ARN=${ALB_ARN}"
echo -e "ALB_DNS=${ALB_DNS}"
