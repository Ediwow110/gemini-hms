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
Write-Host "=== Dependencies Installed ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT — Still required before running:"
Write-Host "1. Create hms-backend/.env from .env.example (Copy-Item .env.example .env)"
Write-Host "2. Start PostgreSQL: docker compose up -d db"
Write-Host "3. Push schema: cd hms-backend; npx prisma db push"
Write-Host "4. Seed data: cd hms-backend; npx prisma db seed"
Write-Host ""
Write-Host "To start the project (two separate terminals):"
Write-Host "1. Backend: cd hms-backend; npm run start:dev"
Write-Host "2. Frontend: cd hms-frontend; npm run dev"
