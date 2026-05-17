CREATE TABLE icu_beds (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    room_number VARCHAR(100) NOT NULL,
    bed_identifier VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'VACANT', -- 'VACANT', 'OCCUPIED', 'MAINTENANCE'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE icu_monitors (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    bed_id VARCHAR(36) NOT NULL,
    hardware_serial VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ONLINE',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (bed_id) REFERENCES icu_beds(id) ON DELETE CASCADE
);

CREATE TABLE vitals_summary_logs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    monitor_id VARCHAR(36) NOT NULL,
    logged_minute TIMESTAMP NOT NULL,
    avg_heart_rate INT NOT NULL,
    avg_spo2 INT NOT NULL,
    avg_map INT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (monitor_id) REFERENCES icu_monitors(id) ON DELETE CASCADE
);

-- Optimize intensive rolling analytics polling against telemetry streaming outputs mathematically
CREATE INDEX idx_vitals_summary_logs ON vitals_summary_logs (tenant_id, monitor_id, logged_minute DESC);
