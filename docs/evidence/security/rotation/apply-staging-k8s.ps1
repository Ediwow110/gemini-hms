# apply-staging-k8s.ps1
param()

# Usage:
#   $env:JWT_SECRET = '...'; $env:JWT_REFRESH_SECRET = '...'; $env:DATABASE_URL = '...'; .\apply-staging-k8s.ps1

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$evidence = $env:EVIDENCE_DIR
if (-not $evidence) { $evidence = "docs\\evidence\\security\\rotation\\$ts" }
New-Item -ItemType Directory -Force -Path $evidence | Out-Null

if (-not $env:JWT_SECRET) { Write-Error "JWT_SECRET not set"; exit 2 }
if (-not $env:JWT_REFRESH_SECRET) { Write-Error "JWT_REFRESH_SECRET not set"; exit 2 }
if (-not $env:DATABASE_URL) { Write-Error "DATABASE_URL not set"; exit 2 }

Write-Output "Applying Kubernetes secret to 'staging' namespace; evidence -> $evidence"

kubectl -n staging create secret generic app-secrets `
  --from-literal=JWT_SECRET="$($env:JWT_SECRET)" `
  --from-literal=JWT_REFRESH_SECRET="$($env:JWT_REFRESH_SECRET)" `
  --from-literal=DATABASE_URL="$($env:DATABASE_URL)" `
  --dry-run=client -o yaml | kubectl apply -f - > "$evidence\\kubectl-apply.yaml" 2>&1

kubectl -n staging rollout restart deployment/hms-backend > "$evidence\\kubectl-rollout-restart.txt" 2>&1

kubectl -n staging rollout status deployment/hms-backend --timeout=120s > "$evidence\\kubectl-rollout-status.txt" 2>&1

kubectl -n staging get pods -l app=hms-backend -o wide > "$evidence\\pods.txt" 2>&1

if ($env:HEALTH_URL) {
  Write-Output "Running healthcheck against $env:HEALTH_URL"
  curl.exe -fS $env:HEALTH_URL > "$evidence\\healthcheck.txt" 2>&1
} else {
  Write-Output "No HEALTH_URL set; skipping HTTP healthcheck"
}

Write-Output "Kubernetes secrets applied and backend restarted. Evidence saved to $evidence"
