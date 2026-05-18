CREATE TABLE cashier_sessions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    balance_initial NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Enforce strict single active session per user per tenant constraint
CREATE UNIQUE INDEX unique_active_cashier_session ON cashier_sessions (tenant_id, user_id) WHERE status = 'OPEN';

CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE ledger_entries (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invoice_id VARCHAR(36) NOT NULL,
    entry_type VARCHAR(10) NOT NULL, -- 'DEBIT' or 'CREDIT'
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    account_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
