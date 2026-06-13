param(
  [switch]$Monitor
)

$BackendDir = "D:\Vscode\hms-login-OFFICIAL\hms-backend"
$FrontendDir = "D:\Vscode\hms-login-OFFICIAL\hms-frontend"
$LogDir = "D:\Vscode\hms-login-OFFICIAL\.dev-logs"

# Ensure log directory exists
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Start-Backend {
  $job = Start-Job -Name "hms-backend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run start:dev 2>&1
  } -ArgumentList $BackendDir
  Register-ObjectEvent -InputObject $job -EventName StateChanged -Action {
    $j = $event.SourceIdentifier
    Write-Warning "[hms-backend] Job state changed to $($event.SourceEventArgs.NewState)"
  } | Out-Null
  return $job
}

function Start-Frontend {
  $job = Start-Job -Name "hms-frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
  } -ArgumentList $FrontendDir
  Register-ObjectEvent -InputObject $job -EventName StateChanged -Action {
    Write-Warning "[hms-frontend] Job state changed"
  } | Out-Null
  return $job
}

function Test-Port($port) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

# Start both services
Write-Host "Starting backend..." -ForegroundColor Cyan
$backendJob = Start-Backend
Start-Sleep -Seconds 15

Write-Host "Starting frontend..." -ForegroundColor Cyan
$frontendJob = Start-Frontend

# Wait for both to be ready
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
  $be = if (Test-Port 3000) { "UP" } else { "DOWN" }
  $fe = if (Test-Port 5173) { "UP" } else { "DOWN" }

  if ($be -eq "UP" -and $fe -eq "UP") {
    Write-Host "`nBoth services UP! ($($elapsed)s)" -ForegroundColor Green
    break
  }

  Write-Host "[${elapsed}s] Backend: $be | Frontend: $fe"
  Start-Sleep -Seconds 3
  $elapsed += 3
}

if ($Monitor) {
  # Monitoring mode - poll every 10s and restart if needed
  Write-Host "`nMonitoring enabled. Press Ctrl+C to stop." -ForegroundColor Yellow
  while ($true) {
    Start-Sleep -Seconds 10
    $be = Test-Port 3000
    $fe = Test-Port 5173
    $now = Get-Date -Format "HH:mm:ss"

    if (-not $be) {
      Write-Warning "[$now] Backend DOWN - restarting..."
      $backendJob = Start-Backend
    }
    if (-not $fe) {
      Write-Warning "[$now] Frontend DOWN - restarting..."
      Start-Sleep -Seconds 2
      $frontendJob = Start-Frontend
    }
    if ($be -and $fe) {
      Write-Host "[$now] Both UP" -ForegroundColor Green
    }

    # Log job output
    $backendJob | Receive-Job -ErrorAction SilentlyContinue | Out-File -Append -FilePath "$LogDir\backend.log"
    $frontendJob | Receive-Job -ErrorAction SilentlyContinue | Out-File -Append -FilePath "$LogDir\frontend.log"
  }
} else {
  Write-Host "`nServices started as background jobs." -ForegroundColor Green
  Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Green
  Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
  Write-Host "  Logs:     $LogDir" -ForegroundColor Green
  Write-Host "`nRun 'Get-Job -Name hms-*' to check status" -ForegroundColor Gray
  Write-Host "Run './start-dev.ps1 -Monitor' for auto-restart" -ForegroundColor Gray
}
