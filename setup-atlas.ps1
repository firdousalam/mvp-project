# MongoDB Atlas Setup Helper
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Atlas Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path .env) {
    Write-Host "[INFO] .env file already exists" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Do you want to overwrite it? (Y/N)"
    if ($overwrite -ne "Y" -and $overwrite -ne "y") {
        Write-Host "Keeping existing .env file" -ForegroundColor Green
    } else {
        Copy-Item .env.example .env -Force
        Write-Host ".env file created from template" -ForegroundColor Green
    }
} else {
    Copy-Item .env.example .env
    Write-Host ".env file created from template" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit .env file with your MongoDB Atlas credentials" -ForegroundColor Yellow
Write-Host "   - Get connection strings from MongoDB Atlas dashboard" -ForegroundColor Gray
Write-Host "   - Replace username, password, and cluster address" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Build Docker images:" -ForegroundColor Yellow
Write-Host "   npm run docker:atlas:build" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start services:" -ForegroundColor Yellow
Write-Host "   npm run docker:atlas:up" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test the system:" -ForegroundColor Yellow
Write-Host "   Open test-api-gateway.html in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Need help? See MONGODB-ATLAS-SETUP.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Open .env file in default editor
Write-Host "Opening .env file for editing..." -ForegroundColor Yellow
Start-Process .env

Write-Host ""
Read-Host "Press Enter to exit"
