#!/usr/bin/env bash

# Hospital Management System (HMS) - One-Click Setup Script
# This script ensures a clean installation of all dependencies to prevent "white screen" issues.

set -e

echo "=== HMS Full-Stack Setup ==="

# 1. Root Cleanup (Optional but safe)
echo "--- Cleaning project root ---"
# No heavy node_modules at root usually, but just in case.

# 2. Backend Setup
echo "--- Setting up Backend ---"
cd hms-backend
if [ -d "node_modules" ]; then
    echo "Found existing backend node_modules. Cleaning..."
    rm -rf node_modules package-lock.json
fi
npm install --omit=dev=false
npx prisma generate
cd ..

# 3. Frontend Setup
echo "--- Setting up Frontend ---"
cd hms-frontend
if [ -d "node_modules" ]; then
    echo "Found existing frontend node_modules. Cleaning..."
    rm -rf node_modules package-lock.json
fi
npm install --omit=dev=false
cd ..

echo "=== Setup Complete ==="
echo "To start the project:"
echo "1. Backend: cd hms-backend && npm run start:dev"
echo "2. Frontend: cd hms-frontend && npm run dev"
