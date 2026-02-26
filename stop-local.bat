@echo off
echo ========================================
echo Stopping Product Order System
echo ========================================
echo.

echo Stopping Node.js services...
taskkill /F /IM node.exe >nul 2>nul

echo Stopping MongoDB instances...
taskkill /F /IM mongod.exe >nul 2>nul

echo.
echo All services stopped!
echo ========================================
pause
