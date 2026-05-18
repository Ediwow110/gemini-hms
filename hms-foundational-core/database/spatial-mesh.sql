CREATE TABLE patient_beacons (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    hardware_mac_address VARCHAR(255) UNIQUE NOT NULL,
    battery_level INT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOW_BATTERY', 'DISCONNECTED'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE spatial_telemetry_logs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    beacon_id VARCHAR(36) NOT NULL,
    coordinate_x NUMERIC(6,2) NOT NULL,
    coordinate_y NUMERIC(6,2) NOT NULL,
    coordinate_z NUMERIC(6,2) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (beacon_id) REFERENCES patient_beacons(id) ON DELETE CASCADE
);

-- Compound index over high-velocity coordinate arrays mapping exactly back to precise timestamps
CREATE INDEX idx_spatial_telemetry_velocity ON spatial_telemetry_logs (tenant_id, beacon_id, logged_at DESC);

CREATE TABLE geofence_zones (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    polygon_vertices TEXT NOT NULL,
    restriction_level VARCHAR(50) DEFAULT 'SAFE', -- 'SAFE', 'RESTRICTED', 'CRITICAL'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
