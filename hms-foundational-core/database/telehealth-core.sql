CREATE TABLE telehealth_sessions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    appointment_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    session_status VARCHAR(50) DEFAULT 'INITIALIZED', -- 'INITIALIZED', 'CONNECTED', 'DISCONNECTED', 'TERMINATED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Essential composite index accelerating high-frequency polling checks on session states within a specific tenant space
CREATE INDEX idx_telehealth_sessions_status ON telehealth_sessions (tenant_id, session_status);

CREATE TABLE webrtc_signaling_log (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    payload_type VARCHAR(50) NOT NULL, -- 'OFFER', 'ANSWER', 'ICE_CANDIDATE'
    signal_data TEXT NOT NULL,
    exchanged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES telehealth_sessions(id) ON DELETE CASCADE
);
