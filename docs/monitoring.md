# Monitoring & Metrics

## Exposing Metrics

The backend exposes a metrics endpoint at `/api/v1/admin/metrics`.
This endpoint provides:
- Total requests.
- Total errors.
- Successful logins.
- MFA verification failures.
- Uptime and memory usage.

### Prometheus Integration

A Prometheus-compatible plain-text format is available at `/api/v1/admin/metrics/prometheus`.

**To scrape with Prometheus:**
Add the following to your `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'hms-backend'
    metrics_path: '/api/v1/admin/metrics/prometheus'
    static_configs:
      - targets: ['localhost:3000']
```

## Structured Logging

Logs are output in a structured format via the standard NestJS logger.
Every HTTP request is logged with:
- Method
- Path
- Status Code
- Response Time

### ELK / Log Aggregator Setup

1. **Fluentd / Logstash**: Configure a collector to tail the Docker container logs.
2. **Parsing**: Parse the log lines (standard NestJS format).
3. **Indexing**: Ship to Elasticsearch.
