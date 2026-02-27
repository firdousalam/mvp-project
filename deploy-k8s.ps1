# Kubernetes Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kubernetes Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: kubectl not found!" -ForegroundColor Red
    Write-Host "Please enable Kubernetes in Docker Desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Kubernetes is running
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Host "ERROR: Kubernetes is not running!" -ForegroundColor Red
    Write-Host "Please start Kubernetes in Docker Desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Building Docker Images..." -ForegroundColor Yellow
Write-Host ""
docker build -t user-service:latest ./user-service
docker build -t product-service:latest ./product-service
docker build -t order-service:latest ./order-service
Write-Host ""
Write-Host "✓ Docker images built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Deploying MongoDB Databases..." -ForegroundColor Yellow
Write-Host ""
kubectl apply -f k8s/mongodb-user-statefulset.yaml
kubectl apply -f k8s/mongodb-user-service.yaml
kubectl apply -f k8s/mongodb-product-statefulset.yaml
kubectl apply -f k8s/mongodb-product-service.yaml
kubectl apply -f k8s/mongodb-order-statefulset.yaml
kubectl apply -f k8s/mongodb-order-service.yaml
Write-Host ""
Write-Host "Waiting for MongoDB pods to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 30
Write-Host ""

Write-Host "Step 3: Creating ConfigMap and Secrets..." -ForegroundColor Yellow
Write-Host ""
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
Write-Host ""
Write-Host "✓ ConfigMap and Secrets created!" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Deploying Microservices..." -ForegroundColor Yellow
Write-Host ""
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/user-service-service.yaml
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/product-service-service.yaml
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/order-service-service.yaml
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 20
Write-Host ""

Write-Host "Step 5: Deploying Ingress..." -ForegroundColor Yellow
Write-Host ""
kubectl apply -f k8s/ingress.yaml
Write-Host ""
Write-Host "✓ Ingress deployed!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking status..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Pods:" -ForegroundColor White
kubectl get pods
Write-Host ""
Write-Host "Services:" -ForegroundColor White
kubectl get services
Write-Host ""
Write-Host "Ingress:" -ForegroundColor White
kubectl get ingress
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait for all pods to show 'Running' status" -ForegroundColor Yellow
Write-Host "   kubectl get pods -w" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test health endpoints:" -ForegroundColor Yellow
Write-Host "   curl http://localhost/health/user" -ForegroundColor Cyan
Write-Host "   curl http://localhost/health/product" -ForegroundColor Cyan
Write-Host "   curl http://localhost/health/order" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open test-api-gateway.html in your browser" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Monitor with:" -ForegroundColor Yellow
Write-Host "   kubectl get pods" -ForegroundColor Cyan
Write-Host "   kubectl logs -f <pod-name>" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
