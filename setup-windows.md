# HMS Windows Setup & Recovery

## One-Click Fix (Recommended)
If you encounter a "White Screen" or "vite not recognized" error, run this in PowerShell as Administrator from the project root:

```powershell
.\setup.ps1
```

## Manual Setup Steps

### 1. Backend
```powershell
cd hms-backend
# Remove old junk if it exists
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
# Install ALL dependencies (including dev tools)
npm install --include=dev
# Sync DB
npx prisma generate
```

### 2. Frontend
```powershell
cd hms-frontend
# Remove old junk
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
# Install ALL dependencies
npm install --include=dev
```

## Running the Project
- **Backend:** `npm run start:dev`
- **Frontend:** `npm run dev`

---
*Note: If you still see a white screen, check the browser console (F12). If it says "$RefreshSig$ is not defined", it means the dev dependencies were not installed correctly. Re-run the setup script.*
