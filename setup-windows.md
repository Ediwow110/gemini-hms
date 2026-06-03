# HMS Windows Setup & Recovery

## Setup Script (Quick Install)
Run this in PowerShell from the project root to install dependencies:

```powershell
.\setup.ps1
```

> **Note:** The setup script only installs dependencies and runs `prisma generate`. It does **not** create `.env`, run database migrations, or seed the database. Continue with the manual steps below.

## Manual Setup Steps

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (or Docker)
- PowerShell 7+

### 1. Start PostgreSQL (if not already running)
```powershell
docker compose up -d db
```

### 2. Backend Setup
```powershell
cd hms-backend
# Remove old junk if it exists
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
# Install ALL dependencies (including dev tools)
npm install --include=dev
# Create .env from template (replace values as needed)
Copy-Item .env.example .env
# Generate Prisma client
npx prisma generate
# Push schema to database (requires PostgreSQL running)
npx prisma db push
# Seed demo data (requires database connection)
npx prisma db seed
```

### 3. Frontend Setup
```powershell
cd hms-frontend
# Remove old junk
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
# Install ALL dependencies
npm install --include=dev
```

## Running the Project
Start **two separate terminals**:

- **Terminal 1 (Backend):** `cd hms-backend` then `npm run start:dev`
- **Terminal 2 (Frontend):** `cd hms-frontend` then `npm run dev`

The frontend dev server runs on `http://localhost:5173` and proxies API calls to the backend at `http://localhost:3000`.

---
*Note: If you still see a white screen, check the browser console (F12). If it says "$RefreshSig$ is not defined", it means the dev dependencies were not installed correctly. Re-run the setup script.*
