# HMS Setup & Recovery

Write-Host "=== HMS Full-Stack Windows Setup ===" -ForegroundColor Cyan

# 1. Backend
Write-Host "--- Setting up Backend ---" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\hms-backend"
if (Test-Path "node_modules") {
    Write-Host "Cleaning existing backend node_modules..."
    Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
}
npm install --include=dev
npx prisma generate

# 2. Frontend
Write-Host "--- Setting up Frontend ---" -ForegroundColor Yellow
Set-Location "$PSScriptRoot\hms-frontend"
if (Test-Path "node_modules") {
    Write-Host "Cleaning existing frontend node_modules..."
    Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
}
npm install --include=dev

Set-Location $PSScriptRoot
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "To start the project:"
Write-Host "1. Backend: cd hms-backend; npm run start:dev"
Write-Host "2. Frontend: cd hms-frontend; npm run dev"
