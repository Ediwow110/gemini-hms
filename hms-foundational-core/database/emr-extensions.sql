CREATE TABLE clinical_encounters (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NOT NULL,
    encounter_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE soap_notes (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    encounter_id VARCHAR(36) NOT NULL,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES clinical_encounters(id) ON DELETE CASCADE
);
CREATE INDEX idx_soap_tenant_encounter ON soap_notes(tenant_id, encounter_id);

CREATE TABLE icd10_codes (
    code VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    classification_group VARCHAR(100) NOT NULL
);
