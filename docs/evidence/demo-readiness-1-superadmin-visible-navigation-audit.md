# Super Admin Visible Navigation Audit

1. **Phase**: DEMO-READINESS-1 — Super Admin Visible Navigation Audit
2. **Context**: Access control fixes merged. Auditing visible routes for client-demo readiness (not production readiness).
3. **Audit Method**:
   - Environment: Local dev environment (frontend :5173, backend :3000)
   - User context: admin@hospital.com (Super Admin)
   - Branch context: Branch None
   - Verification: Automated runtime traversal via Playwright
   - Timestamp: 2026-06-06T20:05:22.059Z

## Route Inventory

| # | Section | Label | Route | Visible? | Load Result | Problem Type | Severity | Demo Decision | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Platform Control | SuperAdmin Dashboard | `/admin` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [1_SuperAdmin_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/1_SuperAdmin_Dashboard.png) |
| 2 | Platform Control | Tenants Manager | `/admin/tenants` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [2_Tenants_Manager.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/2_Tenants_Manager.png) |
| 3 | Platform Control | Branches Manager | `/admin/branches` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [3_Branches_Manager.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/3_Branches_Manager.png) |
| 4 | Platform Control | Users & Accounts | `/admin/users` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [4_Users___Accounts.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/4_Users___Accounts.png) |
| 5 | Platform Control | Roles & Permissions | `/admin/roles-permissions` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [5_Roles___Permissions.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/5_Roles___Permissions.png) |
| 6 | Security & Compliance | Security Center | `/admin/security` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [6_Security_Center.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/6_Security_Center.png) |
| 7 | Security & Compliance | System Audit Logs | `/admin/audit-logs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [7_System_Audit_Logs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/7_System_Audit_Logs.png) |
| 8 | Security & Compliance | Access Reviews | `/compliance/access-reviews` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [8_Access_Reviews.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/8_Access_Reviews.png) |
| 9 | Security & Compliance | PHI Access Monitor | `/compliance/phi-access` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [9_PHI_Access_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/9_PHI_Access_Monitor.png) |
| 10 | System Operations | Catalog Management | `/admin/catalog` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [10_Catalog_Management.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/10_Catalog_Management.png) |
| 11 | System Operations | Reports & Analytics | `/admin/reports` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [11_Reports___Analytics.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/11_Reports___Analytics.png) |
| 12 | System Operations | System Settings | `/admin/settings` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [12_System_Settings.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/12_System_Settings.png) |
| 13 | System Operations | Integrations | `/integration` | Yes | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [13_Integrations.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/13_Integrations.png) |
| 14 | System Operations | Background Jobs | `/it/background-jobs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [14_Background_Jobs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/14_Background_Jobs.png) |
| 15 | Data Governance | Patient Merges | `/admin/patient-merges` | Yes | API Failures (2) | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [15_Patient_Merges.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/15_Patient_Merges.png) |
| 16 | Data Governance | Data Retention | `/compliance/retention` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [16_Data_Retention.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/16_Data_Retention.png) |
| 17 | Data Governance | Audit Chain Verification | `/compliance/audit-chain` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [17_Audit_Chain_Verification.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/17_Audit_Chain_Verification.png) |
| 18 | Marketplace Governance | Admin Dashboard | `/marketplace-admin` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [18_Admin_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/18_Admin_Dashboard.png) |
| 19 | Marketplace Governance | Supplier Management | `/marketplace-admin/suppliers` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [19_Supplier_Management.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/19_Supplier_Management.png) |
| 20 | Marketplace Governance | Buyer Management | `/marketplace-admin/buyers` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [20_Buyer_Management.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/20_Buyer_Management.png) |
| 21 | Marketplace Governance | Listing Approval | `/marketplace-admin/listing-approval` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [21_Listing_Approval.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/21_Listing_Approval.png) |
| 22 | Marketplace Governance | RFQ Monitor | `/marketplace-admin/rfq-monitor` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [22_RFQ_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/22_RFQ_Monitor.png) |
| 23 | Marketplace Governance | Order Monitor | `/marketplace-admin/order-monitor` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [23_Order_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/23_Order_Monitor.png) |
| 24 | Marketplace Governance | Disputes | `/marketplace-admin/disputes` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [24_Disputes.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/24_Disputes.png) |
| 25 | Marketplace Governance | Commission & Fees | `/marketplace-admin/commission-fees` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [25_Commission___Fees.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/25_Commission___Fees.png) |
| 26 | Marketplace Governance | Reports | `/marketplace-admin/reports` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [26_Reports.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/26_Reports.png) |
| 27 | Clinical Operations | Ops Dashboard | `/clinical/ops` | Yes | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [27_Ops_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/27_Ops_Dashboard.png) |
| 28 | Branch Control | Branch Dashboard | `/branch-admin` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [28_Branch_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/28_Branch_Dashboard.png) |
| 29 | Branch Control | Branch Staff | `/branch-admin/staff` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [29_Branch_Staff.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/29_Branch_Staff.png) |
| 30 | Branch Control | Department Manager | `/branch-admin/departments` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [30_Department_Manager.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/30_Department_Manager.png) |
| 31 | Branch Control | Rooms / Facilities | `/branch-admin/rooms` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [31_Rooms___Facilities.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/31_Rooms___Facilities.png) |
| 32 | Branch Control | Schedules | `/branch-admin/schedules` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [32_Schedules.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/32_Schedules.png) |
| 33 | Operational Setup | Branch Services | `/branch-admin/services` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [33_Branch_Services.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/33_Branch_Services.png) |
| 34 | Operational Setup | Branch Equipment | `/branch-admin/equipment` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [34_Branch_Equipment.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/34_Branch_Equipment.png) |
| 35 | Operational Setup | Inventory Rules | `/branch-admin/inventory-rules` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [35_Inventory_Rules.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/35_Inventory_Rules.png) |
| 36 | Operational Setup | Billing Rules | `/branch-admin/billing-rules` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [36_Billing_Rules.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/36_Billing_Rules.png) |
| 37 | Operational Setup | Queue Settings | `/branch-admin/queue-settings` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [37_Queue_Settings.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/37_Queue_Settings.png) |
| 38 | Governance | Approvals | `/branch-admin/approvals` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [38_Approvals.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/38_Approvals.png) |
| 39 | Governance | Branch Reports | `/reports` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [39_Branch_Reports.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/39_Branch_Reports.png) |
| 40 | Governance | Branch Audit Logs | `/audit-logs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [40_Branch_Audit_Logs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/40_Branch_Audit_Logs.png) |
| 41 | Governance | Branch Settings | `/settings` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [41_Branch_Settings.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/41_Branch_Settings.png) |
| 42 | Compliance Workspace | Compliance Dashboard | `/compliance` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [42_Compliance_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/42_Compliance_Dashboard.png) |
| 43 | Compliance Workspace | PHI Access Monitor | `/compliance/phi-access` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [43_PHI_Access_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/43_PHI_Access_Monitor.png) |
| 44 | Compliance Workspace | Audit Log Review | `/compliance/audit-review` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [44_Audit_Log_Review.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/44_Audit_Log_Review.png) |
| 45 | Compliance Workspace | Access Reviews | `/compliance/access-reviews` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [45_Access_Reviews.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/45_Access_Reviews.png) |
| 46 | Compliance Workspace | Data Export Logs | `/compliance/export-logs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [46_Data_Export_Logs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/46_Data_Export_Logs.png) |
| 47 | Compliance Workspace | Breach Incidents | `/compliance/breach-alerts` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [47_Breach_Incidents.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/47_Breach_Incidents.png) |
| 48 | Compliance Workspace | Data Retention | `/compliance/retention` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [48_Data_Retention.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/48_Data_Retention.png) |
| 49 | Compliance Workspace | Compliance Reports | `/compliance/reports` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [49_Compliance_Reports.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/49_Compliance_Reports.png) |
| 50 | Compliance Workspace | Audit Chain Verification | `/compliance/audit-chain` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [50_Audit_Chain_Verification.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/50_Audit_Chain_Verification.png) |
| 51 | IT Workspace | IT Support Dashboard | `/it` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [51_IT_Support_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/51_IT_Support_Dashboard.png) |
| 52 | IT Workspace | System Health Monitor | `/it/system-health` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [52_System_Health_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/52_System_Health_Monitor.png) |
| 53 | IT Workspace | User Support Queue | `/it/user-support` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [53_User_Support_Queue.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/53_User_Support_Queue.png) |
| 54 | IT Workspace | Active User Sessions | `/it/sessions` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [54_Active_User_Sessions.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/54_Active_User_Sessions.png) |
| 55 | IT Workspace | Background Job Monitor | `/it/background-jobs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [55_Background_Job_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/55_Background_Job_Monitor.png) |
| 56 | IT Workspace | System Integrations | `/it/integrations` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [56_System_Integrations.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/56_System_Integrations.png) |
| 57 | IT Workspace | System Audit Logs | `/it/logs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [57_System_Audit_Logs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/57_System_Audit_Logs.png) |
| 58 | IT Workspace | Backup & Recovery | `/it/backup-restore` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [58_Backup___Recovery.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/58_Backup___Recovery.png) |
| 59 | IT Workspace | Incident Desk | `/it/incidents` | Yes | API Failures (3) | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [59_Incident_Desk.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/59_Incident_Desk.png) |
| 60 | HR Workspace | HR Dashboard | `/hr` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [60_HR_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/60_HR_Dashboard.png) |
| 61 | HR Workspace | Employee Directory | `/hr/employees` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [61_Employee_Directory.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/61_Employee_Directory.png) |
| 62 | HR Workspace | Department Manager | `/hr/departments` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [62_Department_Manager.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/62_Department_Manager.png) |
| 63 | HR Workspace | Attendance Tracking | `/hr/attendance` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [63_Attendance_Tracking.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/63_Attendance_Tracking.png) |
| 64 | HR Workspace | Leave Management | `/hr/leave` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [64_Leave_Management.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/64_Leave_Management.png) |
| 65 | HR Workspace | Payroll Console | `/hr/payroll` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [65_Payroll_Console.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/65_Payroll_Console.png) |
| 66 | HR Workspace | Licenses & Certs | `/hr/licenses` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [66_Licenses___Certs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/66_Licenses___Certs.png) |
| 67 | HR Workspace | Branch Assignments | `/hr/branch-assignments` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [67_Branch_Assignments.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/67_Branch_Assignments.png) |
| 68 | HR Workspace | Termination Desk | `/hr/termination` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [68_Termination_Desk.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/68_Termination_Desk.png) |
| 69 | Procurement Workspace | Procurement Dashboard | `/procurement` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [69_Procurement_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/69_Procurement_Dashboard.png) |
| 70 | Procurement Workspace | Supplier Directory | `/procurement/suppliers` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [70_Supplier_Directory.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/70_Supplier_Directory.png) |
| 71 | Procurement Workspace | Purchase Requests | `/procurement/purchase-requests` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [71_Purchase_Requests.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/71_Purchase_Requests.png) |
| 72 | Procurement Workspace | RFQ Manager | `/procurement/rfqs` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [72_RFQ_Manager.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/72_RFQ_Manager.png) |
| 73 | Procurement Workspace | Quotes & Bids | `/procurement/quotes` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [73_Quotes___Bids.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/73_Quotes___Bids.png) |
| 74 | Procurement Workspace | Purchase Orders | `/procurement/purchase-orders` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [74_Purchase_Orders.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/74_Purchase_Orders.png) |
| 75 | Procurement Workspace | Receiving Dock | `/procurement/receiving` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [75_Receiving_Dock.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/75_Receiving_Dock.png) |
| 76 | Procurement Workspace | Inventory Requests | `/procurement/inventory-requests` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [76_Inventory_Requests.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/76_Inventory_Requests.png) |
| 77 | Procurement Workspace | Vendor Performance | `/procurement/vendor-performance` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [77_Vendor_Performance.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/77_Vendor_Performance.png) |
| 78 | Pharmacy Workspace | Pharmacy Dashboard | `/pharmacy` | Yes | API Failures (2) | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [78_Pharmacy_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/78_Pharmacy_Dashboard.png) |
| 79 | Pharmacy Workspace | Dispense Queue | `/pharmacy/dispense` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [79_Dispense_Queue.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/79_Dispense_Queue.png) |
| 80 | Pharmacy Workspace | Drug Inventory | `/pharmacy/inventory` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [80_Drug_Inventory.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/80_Drug_Inventory.png) |
| 81 | Field Service (Logistics) | Service Dashboard | `/field-service` | Yes | Work in Progress | WIP_PLACEHOLDER | P2 | HIDE_FOR_DEMO | [81_Service_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/81_Service_Dashboard.png) |
| 82 | Field Service (Logistics) | Delivery Jobs | `/field-service/deliveries` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [82_Delivery_Jobs.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/82_Delivery_Jobs.png) |
| 83 | Field Service (Logistics) | Installations | `/field-service/installations` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [83_Installations.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/83_Installations.png) |
| 84 | Field Service (Logistics) | My Schedule | `/field-service/schedule` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [84_My_Schedule.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/84_My_Schedule.png) |
| 85 | Field Service (Logistics) | Handover Checklists | `/field-service/handover` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [85_Handover_Checklists.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/85_Handover_Checklists.png) |
| 86 | Field Service (Logistics) | Proof of Delivery | `/field-service/proof-of-delivery` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [86_Proof_of_Delivery.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/86_Proof_of_Delivery.png) |
| 87 | Field Service (Logistics) | Warranty Activation | `/field-service/warranty-activation` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [87_Warranty_Activation.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/87_Warranty_Activation.png) |
| 88 | Field Service (Logistics) | Preventive Maintenance | `/field-service/preventive-maintenance` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [88_Preventive_Maintenance.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/88_Preventive_Maintenance.png) |
| 89 | Field Service (Logistics) | Service Worklog | `/field-service/service-worklog` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [89_Service_Worklog.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/89_Service_Worklog.png) |
| 90 | Field Service (Logistics) | Offline Sync | `/field-service/offline-sync` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [90_Offline_Sync.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/90_Offline_Sync.png) |
| 91 | Doctor Workspace | Doctor Dashboard | `/doctor` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [91_Doctor_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/91_Doctor_Dashboard.png) |
| 92 | Doctor Workspace | Patient Queue | `/doctor/queue` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [92_Patient_Queue.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/92_Patient_Queue.png) |
| 93 | Doctor Workspace | Patient Directory | `/doctor/patients` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [93_Patient_Directory.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/93_Patient_Directory.png) |
| 94 | Doctor Workspace | EMR Charting | `/doctor/emr` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [94_EMR_Charting.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/94_EMR_Charting.png) |
| 95 | Nurse Workspace | Nurse Dashboard | `/nurse` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [95_Nurse_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/95_Nurse_Dashboard.png) |
| 96 | Nurse Workspace | Triage Queue | `/nurse/triage` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [96_Triage_Queue.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/96_Triage_Queue.png) |
| 97 | Nurse Workspace | Patient Intake | `/nurse/intake` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [97_Patient_Intake.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/97_Patient_Intake.png) |
| 98 | Nurse Workspace | Vitals Logging | `/nurse/vitals` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [98_Vitals_Logging.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/98_Vitals_Logging.png) |
| 99 | Nurse Workspace | Nursing Tasks | `/nurse/tasks` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [99_Nursing_Tasks.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/99_Nursing_Tasks.png) |
| 100 | Nurse Workspace | Specimen Collection | `/nurse/specimens` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [100_Specimen_Collection.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/100_Specimen_Collection.png) |
| 101 | Lab Workspace | Lab Dashboard | `/lab` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [101_Lab_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/101_Lab_Dashboard.png) |
| 102 | Lab Workspace | LIS Orders | `/lab/orders` | Yes | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [102_LIS_Orders.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/102_LIS_Orders.png) |
| 103 | Lab Workspace | Specimen Receiving | `/lab/specimens` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [103_Specimen_Receiving.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/103_Specimen_Receiving.png) |
| 104 | Lab Workspace | Result Entry | `/lab/encoding` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [104_Result_Entry.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/104_Result_Entry.png) |
| 105 | Lab Workspace | QA Verification | `/lab/validation` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [105_QA_Verification.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/105_QA_Verification.png) |
| 106 | Lab Workspace | Pending Release | `/lab/validated` | Yes | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [106_Pending_Release.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/106_Pending_Release.png) |
| 107 | Lab Workspace | Released Results | `/lab/released` | Yes | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [107_Released_Results.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/107_Released_Results.png) |
| 108 | Lab Workspace | Critical Alerts | `/lab/critical-results` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [108_Critical_Alerts.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/108_Critical_Alerts.png) |
| 109 | Lab Workspace | TAT SLA Monitor | `/lab/turnaround` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [109_TAT_SLA_Monitor.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/109_TAT_SLA_Monitor.png) |
| 110 | Cashier Workspace | Cashier Dashboard | `/cashier` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [110_Cashier_Dashboard.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/110_Cashier_Dashboard.png) |
| 111 | Cashier Workspace | Patient Billing | `/cashier/billing` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [111_Patient_Billing.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/111_Patient_Billing.png) |
| 112 | Cashier Workspace | POS Invoices | `/cashier/invoices` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [112_POS_Invoices.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/112_POS_Invoices.png) |
| 113 | Cashier Workspace | Receipts Ledger | `/cashier/payments` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [113_Receipts_Ledger.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/113_Receipts_Ledger.png) |
| 114 | Cashier Workspace | Drawer Session | `/cashier/session` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [114_Drawer_Session.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/114_Drawer_Session.png) |
| 115 | Cashier Workspace | Voids & Refunds | `/cashier/refunds-voids` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [115_Voids___Refunds.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/115_Voids___Refunds.png) |
| 116 | Cashier Workspace | HMO Claims | `/cashier/hmo-claims` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [116_HMO_Claims.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/116_HMO_Claims.png) |
| 117 | Cashier Workspace | Reconciliation | `/cashier/reconciliation` | Yes | Access Restricted | ACCESS_BLOCKED | P1 | HIDE_FOR_DEMO | [117_Reconciliation.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/117_Reconciliation.png) |
| 118 | Dashboard & Core | Command Center | `/` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [118_Command_Center.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/118_Command_Center.png) |
| 119 | Dashboard & Core | Spatial Tracking | `/spatial` | Yes | Page Loaded | WORKING_DEMO_READY | None | SHOW | [119_Spatial_Tracking.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/119_Spatial_Tracking.png) |
| 120 | Admin Extra | Admin Executive | `/admin/executive` | No | Failed to load data | API_DATA_FAILURE | P1 | FIX_BEFORE_DEMO | [120_Admin_Executive.png](file://C:/Users/User/.gemini/antigravity/brain/5fd2a05d-1d08-469c-8998-21aac2239ff9/scratch/120_Admin_Executive.png) |


## API/Data Failures

| Route | Service/Endpoint | HTTP Status | Failure Type | Likely Cause | Recommended Fix |
|---|---|---|---|---|---|
| `/integration` | 404 http://localhost:5173/api/v1/integration/notifications -> {"message":"Cannot GET /api/v1/integration/notifications","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/integration/approvals -> {"message":"Cannot GET /api/v1/integration/approvals","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/integration/activity-audit -> {"message":"Cannot GET /api/v1/integration/activity-audit","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/integration/reconciliation -> {"message":"Cannot GET /api/v1/integration/reconciliation","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/admin/patient-merges` | 404 http://localhost:5173/api/v1/admin/patient-merges -> {"message":"Cannot GET /api/v1/admin/patient-merges","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/admin/patient-merges -> {"message":"Cannot GET /api/v1/admin/patient-merges","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/clinical/ops` | 404 http://localhost:5173/api/v1/clinical-workflow/dashboard-summary -> {"message":"Cannot GET /api/v1/clinical-workflow/dashboard-summary","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/clinical-workflow/work-queue -> {"message":"Cannot GET /api/v1/clinical-workflow/work-queue","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/clinical-workflow/dashboard-summary -> {"message":"Cannot GET /api/v1/clinical-workflow/dashboard-summary","error":"Not Found","statusCode":404} | 403 http://localhost:5173/api/v1/nursing/tasks?status=OPEN -> {"message":"access_denied: missing_branch_context","error":"Forbidden","statusCode":403} | 404 http://localhost:5173/api/v1/clinical-workflow/work-queue -> {"message":"Cannot GET /api/v1/clinical-workflow/work-queue","error":"Not Found","statusCode":404} | 403 http://localhost:5173/api/v1/nursing/tasks?status=OPEN -> {"message":"access_denied: missing_branch_context","error":"Forbidden","statusCode":403} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/it/incidents` | 429 http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50 -> {"statusCode":429,"message":"ThrottlerException: Too Many Requests"} | 429 http://localhost:5173/api/v1/it-support/tickets?priority=URGENT&pageSize=50 -> {"statusCode":429,"message":"ThrottlerException: Too Many Requests"} | 429 http://localhost:5173/api/v1/it-support/tickets?priority=HIGH&pageSize=50 -> {"statusCode":429,"message":"ThrottlerException: Too Many Requests"} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/pharmacy` | 403 http://localhost:5173/api/v1/pharmacy/prescriptions?status=ACTIVE -> {"message":"access_denied: missing_branch_context","error":"Forbidden","statusCode":403} | 403 http://localhost:5173/api/v1/pharmacy/drugs -> {"message":"access_denied: missing_branch_context","error":"Forbidden","statusCode":403} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/lab/orders` | 404 http://localhost:5173/api/v1/clinical-workflow/work-queue -> {"message":"Cannot GET /api/v1/clinical-workflow/work-queue","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/lab/validated` | 404 http://localhost:5173/api/v1/clinical-workflow/lab/validated-results -> {"message":"Cannot GET /api/v1/clinical-workflow/lab/validated-results","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/lab/released` | 404 http://localhost:5173/api/v1/clinical-workflow/lab/released-results -> {"message":"Cannot GET /api/v1/clinical-workflow/lab/released-results","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |
| `/admin/executive` | 404 http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-30&dateTo=2026-06-06 -> {"message":"Cannot GET /api/v1/dashboard/admin/summary?dateFrom=2026-05-30&dateTo=2026-06-06","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-30&dateTo=2026-06-06 -> {"message":"Cannot GET /api/v1/dashboard/admin/trends?dateFrom=2026-05-30&dateTo=2026-06-06","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/alerts -> {"message":"Cannot GET /api/v1/dashboard/admin/alerts","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/top-lists -> {"message":"Cannot GET /api/v1/dashboard/admin/top-lists","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/summary?dateFrom=2026-05-30&dateTo=2026-06-06 -> {"message":"Cannot GET /api/v1/dashboard/admin/summary?dateFrom=2026-05-30&dateTo=2026-06-06","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/trends?dateFrom=2026-05-30&dateTo=2026-06-06 -> {"message":"Cannot GET /api/v1/dashboard/admin/trends?dateFrom=2026-05-30&dateTo=2026-06-06","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/alerts -> {"message":"Cannot GET /api/v1/dashboard/admin/alerts","error":"Not Found","statusCode":404} | 404 http://localhost:5173/api/v1/dashboard/admin/top-lists -> {"message":"Cannot GET /api/v1/dashboard/admin/top-lists","error":"Not Found","statusCode":404} | N/A | API Failure | Backend endpoint unseeded/missing or missing query param | Seed demo data or fix query wrapper |


## WIP Placeholders

| Route | Label | Component | Demo Decision | Recommended Action |
|---|---|---|---|---|
| `/admin/reports` | Reports & Analytics | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/marketplace-admin/commission-fees` | Commission & Fees | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/marketplace-admin/reports` | Reports | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/staff` | Branch Staff | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/departments` | Department Manager | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/rooms` | Rooms / Facilities | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/schedules` | Schedules | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/services` | Branch Services | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/equipment` | Branch Equipment | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/inventory-rules` | Inventory Rules | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/billing-rules` | Billing Rules | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/queue-settings` | Queue Settings | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/branch-admin/approvals` | Approvals | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/reports` | Branch Reports | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/compliance` | Compliance Dashboard | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/it` | IT Support Dashboard | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/it/backup-restore` | Backup & Recovery | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/hr/attendance` | Attendance Tracking | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/hr/payroll` | Payroll Console | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/procurement/purchase-orders` | Purchase Orders | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/pharmacy/dispense` | Dispense Queue | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/pharmacy/inventory` | Drug Inventory | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |
| `/field-service` | Service Dashboard | WIPPage | HIDE_FOR_DEMO | Hide from sidebar/navigation config for demo |


## Access-Blocked Routes

| Route | Label | Expected | Actual | Likely Cause | Recommended Action |
|---|---|---|---|---|---|
| `/doctor` | Doctor Dashboard | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/doctor/queue` | Patient Queue | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/doctor/patients` | Patient Directory | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/doctor/emr` | EMR Charting | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse` | Nurse Dashboard | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse/triage` | Triage Queue | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse/intake` | Patient Intake | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse/vitals` | Vitals Logging | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse/tasks` | Nursing Tasks | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/nurse/specimens` | Specimen Collection | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier` | Cashier Dashboard | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/billing` | Patient Billing | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/invoices` | POS Invoices | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/payments` | Receipts Ledger | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/session` | Drawer Session | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/refunds-voids` | Voids & Refunds | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/hmo-claims` | HMO Claims | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |
| `/cashier/reconciliation` | Reconciliation | Allowed (Global) or Blocked (Clinical) | Blocked | Route marked isBranchScoped: true | Confirm if route is strictly branch-scoped; if not, remove isBranchScoped |


## Demo-Ready Routes
- `/admin` (SuperAdmin Dashboard)
- `/admin/tenants` (Tenants Manager)
- `/admin/branches` (Branches Manager)
- `/admin/users` (Users & Accounts)
- `/admin/roles-permissions` (Roles & Permissions)
- `/admin/security` (Security Center)
- `/admin/audit-logs` (System Audit Logs)
- `/compliance/access-reviews` (Access Reviews)
- `/compliance/phi-access` (PHI Access Monitor)
- `/admin/catalog` (Catalog Management)
- `/admin/settings` (System Settings)
- `/it/background-jobs` (Background Jobs)
- `/compliance/retention` (Data Retention)
- `/compliance/audit-chain` (Audit Chain Verification)
- `/marketplace-admin` (Admin Dashboard)
- `/marketplace-admin/suppliers` (Supplier Management)
- `/marketplace-admin/buyers` (Buyer Management)
- `/marketplace-admin/listing-approval` (Listing Approval)
- `/marketplace-admin/rfq-monitor` (RFQ Monitor)
- `/marketplace-admin/order-monitor` (Order Monitor)
- `/marketplace-admin/disputes` (Disputes)
- `/branch-admin` (Branch Dashboard)
- `/audit-logs` (Branch Audit Logs)
- `/settings` (Branch Settings)
- `/compliance/phi-access` (PHI Access Monitor)
- `/compliance/audit-review` (Audit Log Review)
- `/compliance/access-reviews` (Access Reviews)
- `/compliance/export-logs` (Data Export Logs)
- `/compliance/breach-alerts` (Breach Incidents)
- `/compliance/retention` (Data Retention)
- `/compliance/reports` (Compliance Reports)
- `/compliance/audit-chain` (Audit Chain Verification)
- `/it/system-health` (System Health Monitor)
- `/it/user-support` (User Support Queue)
- `/it/sessions` (Active User Sessions)
- `/it/background-jobs` (Background Job Monitor)
- `/it/integrations` (System Integrations)
- `/it/logs` (System Audit Logs)
- `/hr` (HR Dashboard)
- `/hr/employees` (Employee Directory)
- `/hr/departments` (Department Manager)
- `/hr/leave` (Leave Management)
- `/hr/licenses` (Licenses & Certs)
- `/hr/branch-assignments` (Branch Assignments)
- `/hr/termination` (Termination Desk)
- `/procurement` (Procurement Dashboard)
- `/procurement/suppliers` (Supplier Directory)
- `/procurement/purchase-requests` (Purchase Requests)
- `/procurement/rfqs` (RFQ Manager)
- `/procurement/quotes` (Quotes & Bids)
- `/procurement/receiving` (Receiving Dock)
- `/procurement/inventory-requests` (Inventory Requests)
- `/procurement/vendor-performance` (Vendor Performance)
- `/field-service/deliveries` (Delivery Jobs)
- `/field-service/installations` (Installations)
- `/field-service/schedule` (My Schedule)
- `/field-service/handover` (Handover Checklists)
- `/field-service/proof-of-delivery` (Proof of Delivery)
- `/field-service/warranty-activation` (Warranty Activation)
- `/field-service/preventive-maintenance` (Preventive Maintenance)
- `/field-service/service-worklog` (Service Worklog)
- `/field-service/offline-sync` (Offline Sync)
- `/lab` (Lab Dashboard)
- `/lab/specimens` (Specimen Receiving)
- `/lab/encoding` (Result Entry)
- `/lab/validation` (QA Verification)
- `/lab/critical-results` (Critical Alerts)
- `/lab/turnaround` (TAT SLA Monitor)
- `/` (Command Center)
- `/spatial` (Spatial Tracking)

## Routes to Hide before Demo
- `/admin/reports` (Reports & Analytics)
- `/marketplace-admin/commission-fees` (Commission & Fees)
- `/marketplace-admin/reports` (Reports)
- `/branch-admin/staff` (Branch Staff)
- `/branch-admin/departments` (Department Manager)
- `/branch-admin/rooms` (Rooms / Facilities)
- `/branch-admin/schedules` (Schedules)
- `/branch-admin/services` (Branch Services)
- `/branch-admin/equipment` (Branch Equipment)
- `/branch-admin/inventory-rules` (Inventory Rules)
- `/branch-admin/billing-rules` (Billing Rules)
- `/branch-admin/queue-settings` (Queue Settings)
- `/branch-admin/approvals` (Approvals)
- `/reports` (Branch Reports)
- `/compliance` (Compliance Dashboard)
- `/it` (IT Support Dashboard)
- `/it/backup-restore` (Backup & Recovery)
- `/hr/attendance` (Attendance Tracking)
- `/hr/payroll` (Payroll Console)
- `/procurement/purchase-orders` (Purchase Orders)
- `/pharmacy/dispense` (Dispense Queue)
- `/pharmacy/inventory` (Drug Inventory)
- `/field-service` (Service Dashboard)
- `/doctor` (Doctor Dashboard)
- `/doctor/queue` (Patient Queue)
- `/doctor/patients` (Patient Directory)
- `/doctor/emr` (EMR Charting)
- `/nurse` (Nurse Dashboard)
- `/nurse/triage` (Triage Queue)
- `/nurse/intake` (Patient Intake)
- `/nurse/vitals` (Vitals Logging)
- `/nurse/tasks` (Nursing Tasks)
- `/nurse/specimens` (Specimen Collection)
- `/cashier` (Cashier Dashboard)
- `/cashier/billing` (Patient Billing)
- `/cashier/invoices` (POS Invoices)
- `/cashier/payments` (Receipts Ledger)
- `/cashier/session` (Drawer Session)
- `/cashier/refunds-voids` (Voids & Refunds)
- `/cashier/hmo-claims` (HMO Claims)
- `/cashier/reconciliation` (Reconciliation)

## Routes to Fix before Demo
- `/integration` (Integrations)
- `/admin/patient-merges` (Patient Merges)
- `/clinical/ops` (Ops Dashboard)
- `/it/incidents` (Incident Desk)
- `/pharmacy` (Pharmacy Dashboard)
- `/lab/orders` (LIS Orders)
- `/lab/validated` (Pending Release)
- `/lab/released` (Released Results)
- `/admin/executive` (Admin Executive)

## Security Notes
- No real patient data or PHI was used during this audit pass.
- No production-readiness or compliance (HIPAA/SOC 2) claims are made.
- Destructive/mutating admin actions were not tested or exercised.

## Final Recommendation
1. Hide all WIP Placeholder routes and Access Blocked clinical routes from the sidebar menu when logged in as Super Admin with Branch: None, to avoid client confusion.
2. Fix any data-load failures on key routes before the demo.
3. Verdict: STAGING-ONLY / DEMO-READINESS AUDIT COMPLETE
