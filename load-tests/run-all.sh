#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=================================================="
echo "          HMS ENTERPRISE GA LOAD TEST RUNNER      "
echo "=================================================="

# Ensure results directory exists
mkdir -p load-tests/results

# Base configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
TENANT_ID=${TENANT_ID:-"00000000-0000-0000-0000-00000000000e"}

echo "Running Auth Stress Test..."
k6 run -e BASE_URL=$BASE_URL -e TENANT_ID=$TENANT_ID --summary-export=load-tests/results/auth-summary.json load-tests/auth-stress.js

echo "Running Billing Stress Test..."
k6 run -e BASE_URL=$BASE_URL -e TENANT_ID=$TENANT_ID --summary-export=load-tests/results/billing-summary.json load-tests/billing-stress.js

echo "Running Analytics Stress Test..."
k6 run -e BASE_URL=$BASE_URL -e TENANT_ID=$TENANT_ID --summary-export=load-tests/results/analytics-summary.json load-tests/analytics-stress.js

echo "=================================================="
echo "All stress tests completed successfully!         "
echo "Results exported to load-tests/results/          "
echo "=================================================="
