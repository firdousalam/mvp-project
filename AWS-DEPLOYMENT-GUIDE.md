# AWS Deployment Guide - Product Order System

Complete guide for deploying the microservices application to AWS using ECS Fargate, ECR, and DocumentDB.

## Architecture Overview

```
Internet → ALB → ECS Fargate Services → DocumentDB (MongoDB)
           ↓
        Target Groups
           ↓
    [user-service, product-service, order-service]
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Docker installed locally
- Node.js 18+ installed

## Table of Contents

1. [Setup AWS Infrastructure](#1-setup-aws-infrastructure)
2. [Create DocumentDB Cluster](#2-create-documentdb-cluster)
3. [Build and Push Docker Images](#3-build-and-push-docker-images)
4. [Deploy to ECS Fargate](#4-deploy-to-ecs-fargate)
5. [Configure Application Load Balancer](#5-configure-application-load-balancer)
6. [Environment Variables and Secrets](#6-environment-variables-and-secrets)
7. [Monitoring and Logging](#7-monitoring-and-logging)
8. [Cost Optimization](#8-cost-optimization)

---

## 1. Setup AWS Infrastructure

### 1.1 Create VPC and Subnets

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=product-order-vpc}]'

# Note the VPC ID from output
export VPC_ID=<your-vpc-id>
