# Kubernetes Cleanup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kubernetes Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "WARNING: This will delete all Kubernetes resources!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Are you sure? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cleanup cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Deleting all resources..." -ForegroundColor Yellow
Write-Host ""

# Delete in reverse order
Write-Host "Deleting Ingress..." -ForegroundColor Gray
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

Write-Host "Deleting Services..." -ForegroundColor Gray
kubectl delete -f k8s/user-service-service.yaml --ignore-not-found=true
kubectl delete -f k8s/product-service-service.yaml --ignore-not-found=true
kubectl delete -f k8s/order-service-service.yaml --ignore-not-found=true

Write-Host "Deleting Deployments..." -ForegroundColor Gray
kubectl delete -f k8s/user-service-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/product-service-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/order-service-deployment.yaml --ignore-not-found=true

Write-Host "Deleting ConfigMap and Secrets..." -ForegroundColor Gray
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
kubectl delete -f k8s/secret.yaml --ignore-not-found=true

Write-Host "Deleting MongoDB Services..." -ForegroundColor Gray
kubectl delete -f k8s/mongodb-user-service.yaml --ignore-not-found=true
kubectl delete -f k8s/mongodb-product-service.yaml --ignore-not-found=true
kubectl delete -f k8s/mongodb-order-service.yaml --ignore-not-found=true

Write-Host "Deleting MongoDB StatefulSets..." -ForegroundColor Gray
kubectl delete -f k8s/mongodb-user-statefulset.yaml --ignore-not-found=true
kubectl delete -f k8s/mongodb-product-statefulset.yaml --ignore-not-found=true
kubectl delete -f k8s/mongodb-order-statefulset.yaml --ignore-not-found=true

Write-Host ""
Write-Host "Waiting for resources to be deleted..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Remaining resources:" -ForegroundColor Yellow
kubectl get all
Write-Host ""

Write-Host "To redeploy, run: .\deploy-k8s.ps1" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
