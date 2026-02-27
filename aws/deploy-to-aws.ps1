# AWS Deployment Script for Product Order System (PowerShell)
# This script automates the deployment of all microservices to AWS ECS

$ErrorActionPreference = "Stop"

# Configuration
$env:AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$PROJECT_NAME = "product-order-system"

Write-Host "========================================" -ForegroundColor Green
Write-Host "AWS Deployment - Product Order System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "Error: AWS CLI is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    exit 1
}

# Get AWS Account ID
$env:AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "✓ AWS Account ID: $env:AWS_ACCOUNT_ID" -ForegroundColor Green
Write-Host "✓ AWS Region: $env:AWS_REGION" -ForegroundColor Green

# Step 1: Create ECR Repositories
Write-Host "`nStep 1: Creating ECR repositories..." -ForegroundColor Yellow
$services = @("user-service", "product-service", "order-service", "api-gateway")

foreach ($service in $services) {
    try {
        aws ecr describe-repositories --repository-names "$PROJECT_NAME/$service" --region $env:AWS_REGION 2>$null
        Write-Host "✓ Repository $service already exists" -ForegroundColor Green
    }
    catch {
        aws ecr create-repository --repository-name "$PROJECT_NAME/$service" --region $env:AWS_REGION
        Write-Host "✓ Created repository $service" -ForegroundColor Green
    }
}

# Step 2: Build and Push Docker Images
Write-Host "`nStep 2: Building and pushing Docker images..." -ForegroundColor Yellow

# Login to ECR
$ecrPassword = aws ecr get-login-password --region $env:AWS_REGION
$ecrPassword | docker login --username AWS --password-stdin "$env:AWS_ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com"

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    docker build -t $service "./$service"
    
    Write-Host "Tagging $service..." -ForegroundColor Yellow
    docker tag "${service}:latest" "$env:AWS_ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com/$PROJECT_NAME/${service}:latest"
    
    Write-Host "Pushing $service..." -ForegroundColor Yellow
    docker push "$env:AWS_ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com/$PROJECT_NAME/${service}:latest"
    
    Write-Host "✓ $service deployed to ECR" -ForegroundColor Green
}

# Step 3: Create ECS Cluster
Write-Host "`nStep 3: Creating ECS cluster..." -ForegroundColor Yellow
try {
    $clusterStatus = aws ecs describe-clusters --clusters "$PROJECT_NAME-cluster" --region $env:AWS_REGION --query 'clusters[0].status' --output text 2>$null
    if ($clusterStatus -eq "ACTIVE") {
        Write-Host "✓ Cluster already exists" -ForegroundColor Green
    }
}
catch {
    aws ecs create-cluster --cluster-name "$PROJECT_NAME-cluster" --region $env:AWS_REGION
    Write-Host "✓ Created ECS cluster" -ForegroundColor Green
}

# Step 4: Create CloudWatch Log Groups
Write-Host "`nStep 4: Creating CloudWatch log groups..." -ForegroundColor Yellow
foreach ($service in $services) {
    try {
        $logGroup = aws logs describe-log-groups --log-group-name-prefix "/ecs/$PROJECT_NAME/$service" --region $env:AWS_REGION --query 'logGroups[0]' 2>$null
        if ($logGroup) {
            Write-Host "✓ Log group for $service already exists" -ForegroundColor Green
        }
    }
    catch {
        aws logs create-log-group --log-group-name "/ecs/$PROJECT_NAME/$service" --region $env:AWS_REGION
        Write-Host "✓ Created log group for $service" -ForegroundColor Green
    }
}

# Step 5: Register Task Definitions
Write-Host "`nStep 5: Registering ECS task definitions..." -ForegroundColor Yellow
foreach ($service in $services) {
    # Replace placeholders in task definition
    $taskDefContent = Get-Content "aws/task-definitions/$service.json" -Raw
    $taskDefContent = $taskDefContent -replace '\$\{AWS_ACCOUNT_ID\}', $env:AWS_ACCOUNT_ID
    $taskDefContent = $taskDefContent -replace '\$\{AWS_REGION\}', $env:AWS_REGION
    $taskDefContent | Out-File -FilePath "$env:TEMP/$service-task-def.json" -Encoding UTF8
    
    aws ecs register-task-definition --cli-input-json "file:///$env:TEMP/$service-task-def.json" --region $env:AWS_REGION
    Write-Host "✓ Registered task definition for $service" -ForegroundColor Green
}

# Step 6: Update or Create Services
Write-Host "`nStep 6: Updating ECS services..." -ForegroundColor Yellow
Write-Host "Note: This assumes you have already created the ALB, target groups, and security groups" -ForegroundColor Yellow
Write-Host "If not, please run the manual setup steps from AWS-DEPLOYMENT-GUIDE.md first" -ForegroundColor Yellow

$response = Read-Host "Have you completed the ALB and networking setup? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Please complete the networking setup and run this script again" -ForegroundColor Yellow
    exit 0
}

# Get VPC and subnet information
$VPC_ID = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $env:AWS_REGION
$SUBNET_IDS = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0:2].SubnetId" --output text --region $env:AWS_REGION
$ECS_SG_ID = aws ec2 describe-security-groups --filters "Name=group-name,Values=$PROJECT_NAME-ecs-sg" --query "SecurityGroups[0].GroupId" --output text --region $env:AWS_REGION

Write-Host "✓ VPC ID: $VPC_ID" -ForegroundColor Green
Write-Host "✓ Subnets: $SUBNET_IDS" -ForegroundColor Green
Write-Host "✓ Security Group: $ECS_SG_ID" -ForegroundColor Green

# Update services (force new deployment)
foreach ($service in $services) {
    try {
        $serviceStatus = aws ecs describe-services --cluster "$PROJECT_NAME-cluster" --services $service --region $env:AWS_REGION --query 'services[0].status' --output text 2>$null
        if ($serviceStatus -eq "ACTIVE") {
            Write-Host "Updating $service..." -ForegroundColor Yellow
            aws ecs update-service `
                --cluster "$PROJECT_NAME-cluster" `
                --service $service `
                --force-new-deployment `
                --region $env:AWS_REGION
            Write-Host "✓ Updated $service" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Service $service not found. Please create it manually using the guide." -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Check service status: aws ecs describe-services --cluster $PROJECT_NAME-cluster --services user-service"
Write-Host "2. View logs: aws logs tail /ecs/$PROJECT_NAME/user-service --follow"
Write-Host "3. Get ALB DNS: aws elbv2 describe-load-balancers --names $PROJECT_NAME-alb --query 'LoadBalancers[0].DNSName' --output text"
Write-Host "4. Test the API: curl http://`$(aws elbv2 describe-load-balancers --names $PROJECT_NAME-alb --query 'LoadBalancers[0].DNSName' --output text)/health"
