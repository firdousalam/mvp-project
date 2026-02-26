@echo off
echo ========================================
echo Checking Prerequisites
echo ========================================
echo.

set ALL_OK=1

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [FAIL] Node.js is NOT installed
    echo Download from: https://nodejs.org/
    set ALL_OK=0
)
echo.

REM Check npm
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] npm is installed
    npm --version
) else (
    echo [FAIL] npm is NOT installed
    set ALL_OK=0
)
echo.

REM Check MongoDB
echo Checking MongoDB...
where mongod >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB is installed
    mongod --version | findstr "version"
) else (
    echo [FAIL] MongoDB is NOT installed
    echo Download from: https://www.mongodb.com/try/download/community
    set ALL_OK=0
)
echo.

REM Check Docker (optional)
echo Checking Docker (optional)...
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Docker is installed
    docker --version
) else (
    echo [INFO] Docker is NOT installed (optional)
    echo Docker is only needed if you want to use docker-compose
)
echo.

REM Check if dependencies are installed
echo Checking service dependencies...
if exist "user-service\node_modules" (
    echo [OK] User Service dependencies installed
) else (
    echo [WARN] User Service dependencies NOT installed
    echo Run: cd user-service ^&^& npm install
    set ALL_OK=0
)

if exist "product-service\node_modules" (
    echo [OK] Product Service dependencies installed
) else (
    echo [WARN] Product Service dependencies NOT installed
    echo Run: cd product-service ^&^& npm install
    set ALL_OK=0
)

if exist "order-service\node_modules" (
    echo [OK] Order Service dependencies installed
) else (
    echo [WARN] Order Service dependencies NOT installed
    echo Run: cd order-service ^&^& npm install
    set ALL_OK=0
)
echo.

echo ========================================
if %ALL_OK% EQU 1 (
    echo Result: All prerequisites are met!
    echo You can now run: start-local.bat
) else (
    echo Result: Some prerequisites are missing
    echo Please install missing components
)
echo ========================================
echo.
pause
