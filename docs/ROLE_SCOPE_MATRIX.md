# Role Scope Matrix

| Role | Portal / Path | Scope | Allowed Mutating Actions |
|---|---|---|---|
| **Super Admin** | `/admin/*`, `/marketplace-admin/*` | Tenant / Global | Create/update tenants/branches, manage RBAC, reset user security config, moderate marketplace |
| **Branch Admin** | `/branch-admin/*`, `/procurement/*` | Branch | Manage departments, staff assignments, queue parameters, inventory rules, purchase requests |
| **Doctor** | `/doctor/*` | Branch / Clinical | EMR SOAP note signature, clinical orders creation, prescription generation |
| **Nurse** | `/nurse/*` | Branch / Clinical | Intake/triage diagnostics, vitals recording, triage correction |
| **Lab Technician** | `/lab/*` | Branch / Clinical | Lab specimen intake, result encoding, validation, result releases |
| **Cashier** | `/cashier/*` | Branch / Finance | Cash drawer management, billing reconciliation, invoice voids/refunds |
| **Pharmacist** | `/pharmacy/*` | Branch / Clinical | Medication dispensing, inventory audits, stock adjustments |
| **Patient** | `/patient/*` | Own Record | View own released lab results, invoices, active prescriptions |
| **Supplier** | `/supplier/*` | Own Account | Create product listings, submit RFQ quotes, fulfill orders |
| **Marketplace Buyer** | `/marketplace/*` | Own Account | Browse product catalog, request quotes, track orders |
