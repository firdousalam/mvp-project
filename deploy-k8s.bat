@echo off
echo ========================================
echo Kubernetes Deployment Script
echo ========================================
echo.

echo Step 1: Building Docker Images...
echo.
docker build -t user-service:latest ./user-service
docker build -t product-service:latest ./product-service
docker build -t order-service:latest ./order-service
echo.
echo Docker images built successfully!
echo.

echo Step 2: Deploying MongoDB Databases...
echo.
kubectl apply -f k8s/mongodb-user-statefulset.yaml
kubectl apply -f k8s/mongodb-user-service.yaml
kubectl apply -f k8s/mongodb-product-statefulset.yaml
kubectl apply -f k8s/mongodb-product-service.yaml
kubectl apply -f k8s/mongodb-order-statefulset.yaml
kubectl apply -f k8s/mongodb-order-service.yaml
echo.
echo Waiting for MongoDB pods to be ready...
timeout /t 30 /nobreak
echo.

echo Step 3: Creating ConfigMap and Secrets...
echo.
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
echo.

echo Step 4: Deploying Microservices...
echo.
kubectl apply -f k8s/user-service-deployment.yaml
kubectl apply -f k8s/user-service-service.yaml
kubectl apply -f k8s/product-service-deployment.yaml
kubectl apply -f k8s/product-service-service.yaml
kubectl apply -f k8s/order-service-deployment.yaml
kubectl apply -f k8s/order-service-service.yaml
echo.
echo Waiting for services to be ready...
timeout /t 20 /nobreak
echo.

echo Step 5: Deploying Ingress...
echo.
kubectl apply -f k8s/ingress.yaml
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Checking status...
echo.
kubectl get pods
echo.
kubectl get services
echo.
kubectl get ingress
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Wait for all pods to show "Running" status
echo    kubectl get pods -w
echo.
echo 2. Test health endpoints:
echo    curl http://localhost/health/user
echo    curl http://localhost/health/product
echo    curl http://localhost/health/order
echo.
echo 3. Open test-api-gateway.html in your browser
echo.
echo 4. Monitor with: kubectl get pods
echo.
echo ========================================
pause
