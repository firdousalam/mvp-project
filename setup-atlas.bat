@echo off
echo ========================================
echo MongoDB Atlas Setup Helper
echo ========================================
echo.

REM Check if .env file exists
if exist .env (
    echo [INFO] .env file already exists
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :skip_copy
)

REM Copy .env.example to .env
echo Creating .env file from template...
copy .env.example .env
echo.

:skip_copy
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Edit .env file with your MongoDB Atlas credentials
echo    - Get connection strings from MongoDB Atlas dashboard
echo    - Replace username, password, and cluster address
echo.
echo 2. Build Docker images:
echo    npm run docker:atlas:build
echo.
echo 3. Start services:
echo    npm run docker:atlas:up
echo.
echo 4. Test the system:
echo    Open test-api-gateway.html in your browser
echo.
echo ========================================
echo Need help? See MONGODB-ATLAS-SETUP.md
echo ========================================
echo.

REM Open .env file in default editor
echo Opening .env file for editing...
start .env

pause
