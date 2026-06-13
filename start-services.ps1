$BackendDir = "D:\Vscode\hms-login-OFFICIAL\hms-backend"
$FrontendDir = "D:\Vscode\hms-login-OFFICIAL\hms-frontend"
$LogDir = "D:\Vscode\hms-login-OFFICIAL\.dev-logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Start-Service {
  param($Name, $Dir, $Command)
  $logFile = "$LogDir\$Name.log"
  "=== Starting $Name at $(Get-Date) ===" | Out-File -FilePath $logFile
  
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cmd.exe"
  $psi.Arguments = "/c cd /d `"$Dir`" && $Command"
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.WorkingDirectory = $Dir
  
  $p = [System.Diagnostics.Process]::Start($psi)
  
  # Start async readers to capture output
  $outTask = [System.Threading.Tasks.Task]::Run({
    $reader = $p.StandardOutput
    while (-not $reader.EndOfStream) {
      $line = $reader.ReadLine()
      if ($line) { Add-Content -Path $logFile -Value $line }
    }
  })
  $errTask = [System.Threading.Tasks.Task]::Run({
    $reader = $p.StandardError
    while (-not $reader.EndOfStream) {
      $line = $reader.ReadLine()
      if ($line) { Add-Content -Path $logFile -Value "[ERR] $line" }
    }
  })
  
  return @{ Process = $p; Name = $Name; Log = $logFile; OutTask = $outTask; ErrTask = $errTask }
}

function Test-Port($port) {
  try { $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; return $true }
  catch { return $false }
}

Write-Host "Starting backend..." -ForegroundColor Cyan
$be = Start-Service "backend" $BackendDir "npm run start:dev"

Start-Sleep -Seconds 15
Write-Host "Starting frontend..." -ForegroundColor Cyan
$fe = Start-Service "frontend" $FrontendDir "npm run dev"

# Wait for both to be ready (max 60s)
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
  $beUp = Test-Port 3000
  $feUp = Test-Port 5173
  
  if ($beUp -and $feUp) {
    Write-Host "`nBoth services UP! ($($elapsed)s)" -ForegroundColor Green
    break
  }
  
  $beStatus = if ($be.Process.HasExited) { "EXITED($($be.Process.ExitCode))" } elseif ($beUp) { "UP" } else { "starting" }
  $feStatus = if ($fe.Process.HasExited) { "EXITED($($fe.Process.ExitCode))" } elseif ($feUp) { "UP" } else { "starting" }
  
  Write-Host "[${elapsed}s] Backend: $beStatus | Frontend: $feStatus"
  
  if ($be.Process.HasExited) {
    Write-Host "  Backend log tail:" -ForegroundColor Red
    Get-Content "$LogDir\backend.log" -Tail 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
  }
  if ($fe.Process.HasExited) {
    Write-Host "  Frontend log tail:" -ForegroundColor Red
    Get-Content "$LogDir\frontend.log" -Tail 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
  }
  
  Start-Sleep -Seconds 3
  $elapsed += 3
}

Write-Host "`nService Status:" -ForegroundColor Cyan
Write-Host "  Backend:  $(if (Test-Port 3000) { 'UP' } else { 'DOWN' })  |  http://localhost:3000" -ForegroundColor $(if (Test-Port 3000) { 'Green' } else { 'Red' })
Write-Host "  Frontend: $(if (Test-Port 5173) { 'UP' } else { 'DOWN' })  |  http://localhost:5173" -ForegroundColor $(if (Test-Port 5173) { 'Green' } else { 'Red' })
Write-Host "  Logs:     $LogDir" -ForegroundColor Gray
