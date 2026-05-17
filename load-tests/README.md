# HMS Enterprise Load Testing Suite (k6)

This directory contains declarative load testing scripts built on top of **k6** by Grafana. These tests simulate concurrent production utilization levels to guarantee performance boundaries under scale.

---

## 1. Installation Guide

`k6` is distributed as a single standalone compiled binary for maximum performance (it is not managed via npm).

### Windows (Chocolatey or winget)
```powershell
choco install k6
# OR
winget install gnu.k6
```

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD194E22E700F4
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## 2. Running Individual Stress Tests

Each load test file is designed to run standalone. You can override target endpoints via the `BASE_URL` environment variable:

### Auth Stress Test (1000 VUs)
```bash
k6 run -e BASE_URL=http://localhost:3000 load-tests/auth-stress.js
```

### Billing Stress Test (500 VUs)
```bash
k6 run -e BASE_URL=http://localhost:3000 -e AUTH_TOKEN=your-jwt-here load-tests/billing-stress.js
```

### Analytics Stress Test (200 VUs)
```bash
k6 run -e BASE_URL=http://localhost:3000 -e AUTH_TOKEN=your-jwt-here load-tests/analytics-stress.js
```

---

## 3. Running All Sequentially

We provide a runner script `load-tests/run-all.sh` to run the tests in sequence and export json summary files.

```bash
chmod +x load-tests/run-all.sh
./load-tests/run-all.sh
```

---

## 4. Interpreting Telemetry & Baseline Metrics

The critical metric keys displayed in your terminal output upon run completion:

- **`http_req_duration`**: The end-to-end request duration (latency). We track `p(95)` (95th percentile) and `p(99)` latency.
- **`http_req_failed`**: The ratio of unsuccessful requests (anything yielding non-2xx status codes).

### Baseline Targets (SLA Boundaries)

| Scenario | Target Concurrent VUs | Target SLA Latency (p95) | Target Success Rate |
|---|---|---|---|
| **Auth Stress** | 1,000 | `< 500ms` | `> 99.0%` |
| **Billing Stress** | 500 | `< 1000ms` (1.0s) | `> 99.5%` |
| **Analytics Stress** | 200 | `< 2000ms` (2.0s) | `> 99.0%` |
