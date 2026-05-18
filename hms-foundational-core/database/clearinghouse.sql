CREATE TABLE insurance_policies (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    policy_holder_name VARCHAR(255) NOT NULL,
    coverage_limit NUMERIC(12,2) NOT NULL,
    escrow_balance NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE adjudication_claims (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    policy_id VARCHAR(36) NOT NULL,
    claim_amount NUMERIC(12,2) NOT NULL,
    resolution_status VARCHAR(50) DEFAULT 'PENDING_CLEARING', -- 'PENDING_CLEARING', 'SETTLED', 'REJECTED_REENTRANCY_FAULT'
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT
);

-- Optimize bounds targeting high-frequency clearing house bounds natively
CREATE INDEX idx_adjudication_resolution ON adjudication_claims (tenant_id, resolution_status);
