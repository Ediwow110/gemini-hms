# apply-production-k8s.ps1
param()

# Usage:
#   $env:PRODUCTION_JWT_SECRET = '...'; $env:PRODUCTION_JWT_REFRESH_SECRET = '...'; $env:PRODUCTION_DATABASE_URL = '...'; .\apply-production-k8s.ps1

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$evidence = $env:EVIDENCE_DIR
if (-not $evidence) { $evidence = "docs\\evidence\\security\\rotation\\$ts" }
New-Item -ItemType Directory -Force -Path $evidence | Out-Null

if (-not $env:PRODUCTION_JWT_SECRET) { Write-Error "PRODUCTION_JWT_SECRET not set"; exit 2 }
if (-not $env:PRODUCTION_JWT_REFRESH_SECRET) { Write-Error "PRODUCTION_JWT_REFRESH_SECRET not set"; exit 2 }
if (-not $env:PRODUCTION_DATABASE_URL) { Write-Error "PRODUCTION_DATABASE_URL not set"; exit 2 }

Write-Output "Applying Kubernetes secret to 'production' namespace; evidence -> $evidence"

kubectl -n production create secret generic app-secrets `
  --from-literal=JWT_SECRET="$($env:PRODUCTION_JWT_SECRET)" `
  --from-literal=JWT_REFRESH_SECRET="$($env:PRODUCTION_JWT_REFRESH_SECRET)" `
  --from-literal=DATABASE_URL="$($env:PRODUCTION_DATABASE_URL)" `
  --dry-run=client -o yaml | kubectl apply -f - > "$evidence\\kubectl-apply.yaml" 2>&1

kubectl -n production rollout restart deployment/hms-backend > "$evidence\\kubectl-rollout-restart.txt" 2>&1

kubectl -n production rollout status deployment/hms-backend --timeout=300s > "$evidence\\kubectl-rollout-status.txt" 2>&1

kubectl -n production get pods -l app=hms-backend -o wide > "$evidence\\pods.txt" 2>&1

if ($env:HEALTH_URL) {
  Write-Output "Running healthcheck against $env:HEALTH_URL"
  curl.exe -fS $env:HEALTH_URL > "$evidence\\healthcheck.txt" 2>&1
} else {
  Write-Output "No HEALTH_URL set; skipping HTTP healthcheck"
}

Write-Output "Production Kubernetes secrets applied and backend restarted. Evidence saved to $evidence"
