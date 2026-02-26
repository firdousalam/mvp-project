# Product Order System - Local Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Product Order System Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is installed
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongoInstalled) {
    Write-Host "ERROR: MongoDB is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting MongoDB instances..." -ForegroundColor Green
Write-Host ""

# Create data directories if they don't exist
$directories = @("data\userdb", "data\productdb", "data\orderdb")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

# Start MongoDB instances in separate windows
Write-Host "Starting MongoDB User Service (port 27017)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mongod --port 27017 --dbpath data\userdb"
Start-Sleep -Seconds 3

Write-Host "Starting MongoDB Product Service (port 27018)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mongod --port 27018 --dbpath data\productdb"
Start-Sleep -Seconds 3

Write-Host "Starting MongoDB Order Service (port 27019)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mongod --port 27019 --dbpath data\orderdb"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "MongoDB instances started!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting microservices..." -ForegroundColor Green
Write-Host ""

# Start services in separate windows
Write-Host "Starting User Service (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd user-service; npm start"
Start-Sleep -Seconds 3

Write-Host "Starting Product Service (port 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd product-service; npm start"
Start-Sleep -Seconds 3

Write-Host "Starting Order Service (port 3003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd order-service; npm start"
Start-Sleep -Seconds 3

Write-Host "Starting API Gateway (port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-gateway; npm start"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor White
Write-Host "- API Gateway:     http://localhost:8080 (Unified Entry Point)" -ForegroundColor Cyan
Write-Host "- User Service:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "- Product Service: http://localhost:3002" -ForegroundColor Cyan
Write-Host "- Order Service:   http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access all services through the API Gateway:" -ForegroundColor White
Write-Host "- Users:    http://localhost:8080/users" -ForegroundColor Gray
Write-Host "- Products: http://localhost:8080/products" -ForegroundColor Gray
Write-Host "- Orders:   http://localhost:8080/orders" -ForegroundColor Gray
Write-Host ""
Write-Host "Health checks:" -ForegroundColor White
Write-Host "- Gateway:  http://localhost:8080/health" -ForegroundColor Gray
Write-Host "- User:     http://localhost:8080/health/user" -ForegroundColor Gray
Write-Host "- Product:  http://localhost:8080/health/product" -ForegroundColor Gray
Write-Host "- Order:    http://localhost:8080/health/order" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening test dashboard..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Open test page in browser
$testPage = Join-Path $PSScriptRoot "test-api.html"
Start-Process $testPage

Write-Host ""
Write-Host "Test dashboard opened in your browser!" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services, run: .\stop-local.ps1" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window (services will continue running)"
