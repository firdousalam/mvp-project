# Product Order System - Stop Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stopping Product Order System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping Node.js services..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Node.js services stopped." -ForegroundColor Green

Write-Host ""
Write-Host "Stopping MongoDB instances..." -ForegroundColor Yellow
Get-Process -Name mongod -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "MongoDB instances stopped." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
