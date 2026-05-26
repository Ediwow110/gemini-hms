# GCP IAM Staging Gate Audit (Phase 18-J)

## 1. Environment Details
- **Repo Base Commit**: `c38ace34febb70ab41a0633377e2c9432df40252`
- **Active GCP Account**: `eediwow866@gmail.com`
- **Active GCP Project**: `unified-xylocarp-j524r`
- **Gate Decision**: **IAM BLOCKED — OWNER ACTION REQUIRED**
  - *Statement*: **Do not proceed to staging provisioning until these permissions are granted and verified.**

---

## 2. IAM Role Audit & Verification Status

| Required Role | Purpose | Verification Status | Details |
| :--- | :--- | :--- | :--- |
| **`roles/serviceusage.serviceUsageAdmin`** | Enable API services | **BLOCKED** | Permission Denied to enable `compute.googleapis.com` |
| **`roles/compute.admin`** | VM deployment / Networking | **BLOCKED** | Unable to list/admin VM resources |
| **`roles/cloudsql.admin`** | Provision PostgreSQL database | **BLOCKED** | Unable to configure database instances |
| **`roles/artifactregistry.admin`** | Push/manage docker images | **BLOCKED** | Unable to build/push build artifacts |
| **`roles/run.admin`** | Cloud Run service management | **BLOCKED** | Unable to deploy serverless containers |
| **`roles/iam.serviceAccountUser`** | Bind service accounts to resources | **BLOCKED** | Unable to attach runtime service identities |
| **`roles/secretmanager.admin`** | Manage DB secrets, JWT keys | **BLOCKED** | Staging secrets access denied |
| **`roles/cloudbuild.builds.editor`** | Execute builds in Cloud Build | **BLOCKED** | Build trigger creation denied |

---

## 3. API Enablement Status

| API Identifier | Service Title | Status | Action Needed |
| :--- | :--- | :--- | :--- |
| `serviceusage.googleapis.com` | Service Usage API | **ENABLED** | None |
| `compute.googleapis.com` | Compute Engine API | **DISABLED** | Enable once permissions are granted |
| `sqladmin.googleapis.com` | Cloud SQL Admin API | **DISABLED** | Enable once permissions are granted |
| `artifactregistry.googleapis.com` | Artifact Registry API | **DISABLED** | Enable once permissions are granted |
| `run.googleapis.com` | Cloud Run API | **DISABLED** | Enable once permissions are granted |
| `secretmanager.googleapis.com` | Secret Manager API | **DISABLED** | Enable once permissions are granted |

---

## 4. Owner IAM Request Package

To proceed with staging provisioning, the project owner/administrator must grant the required permissions to the principal.

- **Project ID**: `unified-xylocarp-j524r`
- **Principal (User)**: `eediwow866@gmail.com`

### Grant Commands (to be run by Project Owner)

The owner can run the following gcloud command blocks to apply these roles:

```bash
# Set variables
PROJECT_ID="unified-xylocarp-j524r"
MEMBER="user:eediwow866@gmail.com"

# Grant API Service Admin permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/serviceusage.serviceUsageAdmin"

# Grant VM / Compute permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/compute.admin"

# Grant Cloud SQL database permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/cloudsql.admin"

# Grant Artifact Registry permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/artifactregistry.admin"

# Grant Cloud Run permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/run.admin"

# Grant Service Account usage permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/iam.serviceAccountUser"

# Grant Secret Manager Admin permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/secretmanager.admin"

# Grant Cloud Build editor permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$MEMBER \
    --role="roles/cloudbuild.builds.editor"
```

---

## 5. Verification Checklist Post-Grant

Once the project owner has confirmed the roles are granted, execute the following to verify:

1. **Verify IAM Policy Access**:
   ```bash
   gcloud projects get-iam-policy unified-xylocarp-j524r --format=json
   ```
2. **Enable Required APIs**:
   ```bash
   gcloud services enable \
       compute.googleapis.com \
       sqladmin.googleapis.com \
       artifactregistry.googleapis.com \
       run.googleapis.com \
       secretmanager.googleapis.com \
       cloudbuild.googleapis.com \
       --project unified-xylocarp-j524r
   ```
3. **Verify API List**:
   ```bash
   gcloud services list --enabled --project unified-xylocarp-j524r
   ```
