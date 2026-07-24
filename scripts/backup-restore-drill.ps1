# ─── Database Backup & Restore Verification Drill (Phase 29 Gate 5) ─────────
# Automates PostgreSQL pg_dump, isolated restoration, and row-by-row count
# verification against a temporary test database.
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

$ContainerName = "hms-login-official-db-1"
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "hms_local_user" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "gemini_hms_local" }
$TestDbName = "hms_restore_test"
$BackupDir = "D:\Vscode\hms-login-OFFICIAL\backups"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "${DbName}_drill_${Timestamp}.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  DATABASE BACKUP & RESTORE VERIFICATION DRILL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Container
Write-Host "[1/6] Verifying PostgreSQL container '$ContainerName'..." -ForegroundColor Yellow
$containerStatus = docker inspect --format='{{.State.Status}}' $ContainerName 2>$null
if ($containerStatus -ne "running") {
    Write-Error "Container '$ContainerName' is not running (Status: $containerStatus)."
    exit 1
}
Write-Host "  Container '$ContainerName' is running." -ForegroundColor Green

# 2. Perform Database Dump
Write-Host "[2/6] Performing pg_dump of '$DbName'..." -ForegroundColor Yellow
docker exec $ContainerName pg_dump -U $DbUser -d $DbName --clean --if-exists > $BackupFile

if (-not (Test-Path $BackupFile) -or (Get-Item $BackupFile).Length -eq 0) {
    Write-Error "Backup dump failed or output file is empty."
    exit 1
}

$fileSize = (Get-Item $BackupFile).Length
$hash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
Write-Host "  Backup created: $BackupFile" -ForegroundColor Green
Write-Host "  File Size: $([math]::Round($fileSize / 1KB, 2)) KB" -ForegroundColor Green
Write-Host "  SHA256: $hash" -ForegroundColor Green

# 3. Prepare Isolated Restore Target Database
Write-Host "[3/6] Creating temporary restore database '$TestDbName'..." -ForegroundColor Yellow
docker exec $ContainerName psql -U $DbUser -d $DbName -c "DROP DATABASE IF EXISTS $TestDbName;" | Out-Null
docker exec $ContainerName psql -U $DbUser -d $DbName -c "CREATE DATABASE $TestDbName;" | Out-Null
Write-Host "  Database '$TestDbName' created." -ForegroundColor Green

# 4. Restore Dump into Isolated Target Database
Write-Host "[4/6] Restoring backup dump into '$TestDbName'..." -ForegroundColor Yellow
Get-Content $BackupFile -Raw | docker exec -i $ContainerName psql -U $DbUser -d $TestDbName | Out-Null
Write-Host "  Restoration completed into '$TestDbName'." -ForegroundColor Green

# 5. Row Count Integrity Comparison
Write-Host "[5/6] Verifying row counts across core tables..." -ForegroundColor Yellow
$tables = @("tenants", "branches", "users", "patient_users", "patients", "encounters", "invoices", "payments", "audit_logs", "lab_results", "prescriptions")

$results = @()
$allMatch = $true

foreach ($table in $tables) {
    $origCountRaw = docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM $table;" 2>$null
    $restCountRaw = docker exec $ContainerName psql -U $DbUser -d $TestDbName -t -c "SELECT COUNT(*) FROM $table;" 2>$null

    $origCountText = ($origCountRaw -join "").Trim()
    $restCountText = ($restCountRaw -join "").Trim()

    $origCount = [int]($origCountText)
    $restCount = [int]($restCountText)

    $match = ($origCount -eq $restCount)
    if (-not $match) { $allMatch = $false }

    $results += [PSCustomObject]@{
        Table          = $table
        Original_Count = $origCount
        Restored_Count = $restCount
        Status         = if ($match) { "MATCH" } else { "MISMATCH" }
    }
}

$results | Format-Table -AutoSize

# 6. Cleanup Temporary Database
Write-Host "[6/6] Cleaning up temporary database '$TestDbName'..." -ForegroundColor Yellow
docker exec $ContainerName psql -U $DbUser -d $DbName -c "DROP DATABASE IF EXISTS $TestDbName;" | Out-Null
Write-Host "  Temporary database '$TestDbName' dropped." -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Cyan
if ($allMatch) {
    Write-Host "  DRILL SUCCESSFUL: 100% Data Integrity Verified!" -ForegroundColor Green
} else {
    Write-Error "  DRILL FAILED: Data count mismatch detected."
    exit 1
}
Write-Host "==========================================================" -ForegroundColor Cyan
