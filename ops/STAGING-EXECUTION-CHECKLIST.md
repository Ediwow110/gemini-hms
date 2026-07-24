# Staging VM Provisioning & Deployment Execution Checklist

**Date:** 2026-07-24  
**Engineer:** Senior DevOps & Infrastructure Engineer  
**Repository:** Ediwow110/gemini-hms  
**Branch:** remediation/production-readiness-lane-2

---

## Prerequisites

Before executing this checklist, ensure you have:

- [ ] Cloud provider account with VM provisioning capability (AWS EC2, DigitalOcean, GCP, Azure, etc.)
- [ ] GitHub repository admin access to `Ediwow110/gemini-hms`
- [ ] Domain or subdomain for staging (e.g., `staging.yourhospital.org`)
- [ ] Local machine with bash, ssh, curl, and openssl

---

## Step A: Staging Host (VM) Provisioning

### A.1 Provision Ubuntu 22.04 LTS VM

**Minimum Specs:**
- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- Public IP address
- OpenSSH server

**Cloud Provider Commands:**

#### AWS EC2
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-your-sg \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=40,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=gemini-hms-staging}]'
```

#### DigitalOcean
```bash
doctl compute droplet create gemini-hms-staging \
  --region nyc3 \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys your-ssh-key-fingerprint \
  --wait
```

#### Google Cloud
```bash
gcloud compute instances create gemini-hms-staging \
  --zone us-central1-a \
  --machine-type e2-medium \
  --boot-disk-size 40GB \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --metadata enable-oslogin=FALSE
```

**Record VM IP:** `__________`

### A.2 Configure Firewall Rules

Ensure these ports are open at the cloud provider level:
- [ ] Port 22 (SSH)
- [ ] Port 80 (HTTP)
- [ ] Port 443 (HTTPS)

Ensure these ports are BLOCKED from public access:
- [ ] Port 5432 (PostgreSQL)
- [ ] Port 6379 (Redis)

### A.3 Run Provisioning Script

```bash
cd ops/
chmod +x provision-staging-vm.sh generate-staging-secrets.sh verify-staging-deployment.sh

# Generate SSH key pair first
ssh-keygen -t ed25519 -f /tmp/staging_deploy_key -N "" -C "github-actions-staging"

# Read the public key
SSH_PUB=$(cat /tmp/staging_deploy_key.pub)

# Run provisioning (replace with your VM IP and the public key)
./provision-staging-vm.sh <VM_IP> "$SSH_PUB" staging.yourhospital.org
```

**Expected Output:**
```
=== VM Provisioning Complete ===
Docker: Docker version 24.x.x
Docker Compose: Docker Compose version v2.x.x
Deploy user: deploy (in docker group)
Firewall: SSH(22), HTTP(80), HTTPS(443) open; PostgreSQL(5432), Redis(6379) blocked
```

---

## Step B: GitHub Repository Secrets Configuration

### B.1 Generate Secrets

```bash
cd ops/
./generate-staging-secrets.sh staging.yourhospital.org
```

This generates all required secrets. Save the output securely.

### B.2 Create GitHub Environment

1. Go to: `https://github.com/Ediwow110/gemini-hms/settings/environments`
2. Click "New environment"
3. Name: `Staging`
4. (Optional) Add required reviewers
5. Click "Configure environment"

### B.3 Add Environment Secrets

Add the following **11 required secrets** to the `Staging` environment:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `STAGING_SSH_HOST` | VM IP or FQDN | From Step A |
| `STAGING_SSH_USER` | `deploy` | Fixed |
| `STAGING_SSH_PRIVATE_KEY` | SSH private key content | From `generate-staging-secrets.sh` |
| `STAGING_SSH_PORT` | `22` | Fixed |
| `STAGING_POSTGRES_USER` | `hms_staging_user` | From generator |
| `STAGING_POSTGRES_PASSWORD` | 32-char random password | From generator |
| `STAGING_POSTGRES_DB` | `gemini_hms_staging` | From generator |
| `STAGING_DATABASE_URL` | Full connection string | From generator |
| `STAGING_JWT_SECRET` | 32-char random hex | From generator |
| `STAGING_MASTER_MFA_KEY` | 32-char random hex | From generator |
| `STAGING_CORS_ORIGINS` | `https://staging.yourhospital.org,http://localhost:5173` | From generator |

### B.4 Add SSH Public Key to VM

```bash
# Get the public key from the generator output
# Then add it to the VM:
ssh root@<VM_IP> "echo '<SSH_PUBLIC_KEY>' >> /home/deploy/.ssh/authorized_keys"
```

---

## Step C: Trigger Deployment & Verify

### C.1 Trigger Staging Deployment

**Option 1: GitHub Actions UI**
1. Go to: `https://github.com/Ediwow110/gemini-hms/actions/workflows/deploy-staging.yml`
2. Click "Run workflow"
3. Select branch: `main` (or current branch)
4. Click "Run workflow"

**Option 2: GitHub CLI**
```bash
gh workflow run deploy-staging.yml --ref main
```

### C.2 Monitor Deployment

The workflow has 2 jobs:
1. `docker-build` - Builds and packages immutable staging images
2. `cd-deploy-staging` - SSH delivery to staging VM

Wait for both jobs to complete (green checkmarks).

### C.3 Run Verification Script

```bash
cd ops/
./verify-staging-deployment.sh staging.yourhospital.org
```

**Expected checks:**
- [ ] DNS resolves correctly
- [ ] SSH access works
- [ ] Docker containers running
- [ ] Backend health endpoint returns 200
- [ ] Frontend returns 200
- [ ] CSRF tokens available
- [ ] Database accepting connections
- [ ] No critical errors in logs
- [ ] Ports 80/443 open, 5432/6379 blocked

### C.4 Manual Health Probes

```bash
# Backend health
curl -f http://<STAGING_HOST>/api/v1/health
# Expected: {"status":"UP","timestamp":"...","services":{"db":"UP","redis":"UP"}}

# Frontend
curl -f http://<STAGING_HOST>/ -I
# Expected: HTTP/1.1 200 OK
```

### C.5 Container Health Check (via SSH)

```bash
ssh deploy@<STAGING_HOST>
docker compose -f /home/deploy/app/docker-compose.staging.yml ps
# All containers should show "healthy" or "running"

docker compose -f /home/deploy/app/docker-compose.staging.yml logs --tail=20 backend
# Check for any startup errors
```

---

## Post-Deployment Verification

### Application Smoke Tests

| Test | Action | Expected |
|------|--------|----------|
| Landing page | Browser → staging URL | Login page renders |
| Login flow | Submit seeded credentials | Redirect to dashboard |
| CSRF bootstrap | Inspect login response | `csrfToken` in body |
| Protected route | Access dashboard | 200, user data loads |
| Branch selection | Select a branch | Redirect to branch dashboard |
| Billing page | Navigate to /billing | Payments list loads |
| Audit page | Navigate to audit | Audit log loads |
| Logout | Click logout | Redirect to login |

### Security Verification

| Test | Action | Expected |
|------|--------|----------|
| CORS headers | Check response headers | `Access-Control-Allow-Origin` matches |
| CSRF protection | POST without X-CSRF-Token | 403 Forbidden |
| MFA step-up | Trigger sensitive action | MFA challenge prompt |
| Session isolation | Log in as different user | No data leak |

---

## Troubleshooting

### Backend fails to start
```bash
ssh deploy@<VM_IP>
docker compose -f /home/deploy/app/docker-compose.staging.yml logs backend
# Look for: database connection errors, missing env vars, migration failures
```

### Database not healthy
```bash
ssh deploy@<VM_IP>
docker compose -f /home/deploy/app/docker-compose.staging.yml logs db
# Check: POSTGRES_USER/PASSWORD/DB match DATABASE_URL
```

### Frontend returns 502
```bash
ssh deploy@<VM_IP>
docker compose -f /home/deploy/app/docker-compose.staging.yml logs frontend
# Check: backend is healthy (frontend depends on backend)
```

### Migration fails
```bash
ssh deploy@<VM_IP>
docker compose -f /home/deploy/app/docker-compose.staging.yml run --rm --no-deps backend npx prisma migrate deploy
# Check: DATABASE_URL is correct, DB is accessible
```

---

## Success Criteria

Deployment is successful when ALL of the following are true:

1. ✅ GitHub Actions `deploy-staging.yml` completes with green checkmarks
2. ✅ `curl -f http://<STAGING_HOST>/api/v1/health` returns `{"status":"UP"}`
3. ✅ `curl -f http://<STAGING_HOST>/` returns HTTP 200
4. ✅ All 3 containers (db, backend, frontend) are running and healthy
5. ✅ Database migrations applied successfully
6. ✅ No critical errors in container logs
7. ✅ Ports 5432 and 6379 are NOT publicly accessible
8. ✅ Login flow works with seeded credentials

---

## Files Created in This Session

| File | Purpose |
|------|---------|
| `ops/provision-staging-vm.sh` | Automated VM provisioning script |
| `ops/generate-staging-secrets.sh` | Cryptographic secret generation |
| `ops/verify-staging-deployment.sh` | Deployment verification with health probes |
| `ops/STAGING-EXECUTION-CHECKLIST.md` | This document |

---

## References

- Staging handoff guide: `docs/infrastructure/staging-provisioning-handoff.md`
- Staging workflow: `.github/workflows/deploy-staging.yml`
- Staging compose: `docker-compose.staging.yml`
- Remote deploy script: `hms-backend/scripts/remote-deploy-staging.sh`
