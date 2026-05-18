CREATE TABLE operating_rooms (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    room_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED', 'STERILIZATION_REQUIRED'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE surgical_cases (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    room_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    primary_surgeon_id VARCHAR(36) NOT NULL,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES operating_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_surgeon_id) REFERENCES users(id) ON DELETE CASCADE,
    -- PostgreSQL EXCLUDE constraint preventing double-booking rooms strictly at the database integrity level
    CONSTRAINT exclude_overlapping_room_bookings EXCLUDE USING GIST (
        room_id WITH =,
        tsrange(scheduled_start, scheduled_end) WITH &&
    )
);

CREATE TABLE anesthesia_telemetry_logs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    surgical_case_id VARCHAR(36) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gas_mixture_ratio NUMERIC(4,2) NOT NULL,
    agent_concentration NUMERIC(4,2) NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (surgical_case_id) REFERENCES surgical_cases(id) ON DELETE CASCADE
);
