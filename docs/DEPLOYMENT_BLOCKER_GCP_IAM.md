# Deployment Blocker GCP IAM Runbook

## Current Blocker
The deployment steps `provision-deployment` and `cd-deploy` in the GitHub Actions pipelines fail. The deployment host server cannot spin up or configure target VMs/databases because Google Cloud APIs are disabled and the active GCP account lacks administrative access on project `unified-xylocarp-j524r`.

## Required Actions for Project Owner

### 1. Grant IAM Policies
Run these commands from an admin console to bind required roles to principal `eediwow866@gmail.com`:
```bash
gcloud projects add-iam-policy-binding unified-xylocarp-j524r \
  --member="user:eediwow866@gmail.com" \
  --role="roles/serviceusage.serviceUsageAdmin"

gcloud projects add-iam-policy-binding unified-xylocarp-j524r \
  --member="user:eediwow866@gmail.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding unified-xylocarp-j524r \
  --member="user:eediwow866@gmail.com" \
  --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding unified-xylocarp-j524r \
  --member="user:eediwow866@gmail.com" \
  --role="roles/artifactregistry.admin"
```

### 2. Enable APIs
Enable Google Cloud APIs using:
```bash
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  --project unified-xylocarp-j524r
```

### 3. Verification
Verify enablement status with:
```bash
gcloud services list --enabled --project unified-xylocarp-j524r
```
Once the APIs are enabled and permissions are bound, restart the deployment workflow in GitHub Actions.
