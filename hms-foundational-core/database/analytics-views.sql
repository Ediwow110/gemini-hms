-- View for dynamic financial summaries mapping back to master tenant records
CREATE VIEW view_tenant_financial_summaries AS
SELECT 
    l.tenant_id,
    'GENERAL_ACCOUNTS' as account_code,
    SUM(l.ledger_debit) as gross_invoiced_volume,
    SUM(l.ledger_credit) as total_liquid_settled_capital,
    SUM(l.ledger_debit) - SUM(l.ledger_credit) as total_outstanding_balance_owed
FROM 
    ledger_entries l
GROUP BY 
    l.tenant_id;

-- View for patient encounters aggregates compiling active throughput per branch
CREATE VIEW view_patient_encounter_aggregates AS
SELECT 
    e.tenant_id,
    e.branch_id,
    COUNT(e.id) as active_check_in_counts
FROM 
    encounters e
WHERE 
    e.status = 'ACTIVE'
GROUP BY 
    e.tenant_id,
    e.branch_id;
