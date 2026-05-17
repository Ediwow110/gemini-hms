CREATE TABLE emergency_bays (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    bay_name VARCHAR(100) NOT NULL,
    is_isolation_capable BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'VACANT', -- 'VACANT', 'OCCUPIED', 'DIVERSION_FORCED'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE er_admissions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    bay_id VARCHAR(36) NULL,
    esi_level INT NOT NULL,
    glasgow_coma_scale INT NOT NULL,
    requires_isolation BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ARRIVED',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bay_id) REFERENCES emergency_bays(id) ON DELETE SET NULL
);

-- Essential index isolating continuous high-velocity triage queue polls natively sorting by urgency mathematically
CREATE INDEX idx_triage_acuity ON er_admissions (tenant_id, esi_level ASC, status);
