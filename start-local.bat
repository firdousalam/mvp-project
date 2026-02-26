@echo off
echo ========================================
echo Starting Product Order System Locally
echo ========================================
echo.

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MongoDB is not installed or not in PATH
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo Starting MongoDB instances...
echo.

REM Create data directories if they don't exist
if not exist "data\userdb" mkdir data\userdb
if not exist "data\productdb" mkdir data\productdb
if not exist "data\orderdb" mkdir data\orderdb

REM Start MongoDB instances in separate windows
start "MongoDB User Service" cmd /k "mongod --port 27017 --dbpath data\userdb"
timeout /t 3 /nobreak >nul

start "MongoDB Product Service" cmd /k "mongod --port 27018 --dbpath data\productdb"
timeout /t 3 /nobreak >nul

start "MongoDB Order Service" cmd /k "mongod --port 27019 --dbpath data\orderdb"
timeout /t 5 /nobreak >nul

echo MongoDB instances started!
echo.
echo Starting microservices...
echo.

REM Start services in separate windows
start "User Service" cmd /k "cd user-service && npm start"
timeout /t 3 /nobreak >nul

start "Product Service" cmd /k "cd product-service && npm start"
timeout /t 3 /nobreak >nul

start "Order Service" cmd /k "cd order-service && npm start"

echo.
echo Starting API Gateway...
timeout /t 3 /nobreak >nul
start "API Gateway" cmd /k "cd api-gateway && npm start"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Services will be available at:
echo - API Gateway:     http://localhost:8080 (Unified Entry Point)
echo - User Service:    http://localhost:3001
echo - Product Service: http://localhost:3002
echo - Order Service:   http://localhost:3003
echo.
echo Access all services through the API Gateway:
echo - Users:    http://localhost:8080/users
echo - Products: http://localhost:8080/products
echo - Orders:   http://localhost:8080/orders
echo.
echo Health checks:
echo - Gateway:  http://localhost:8080/health
echo - User:     http://localhost:8080/health/user
echo - Product:  http://localhost:8080/health/product
echo - Order:    http://localhost:8080/health/order
echo.
echo Press any key to open the test page...
pause >nul

REM Open test page in browser
start http://localhost:3001/health
