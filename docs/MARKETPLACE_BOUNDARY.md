# Marketplace Domain Boundary Runbook

## Core Principles
The HMS marketplace contains three distinct functional areas:
1. **Marketplace Buyer (Shopping/RFQ)**: Allows customers or procurement agents to browse, request quotes, configure carts, and track deliveries.
2. **Supplier Operations**: Enables registered vendors to list products/services, view RFQ requests, submit quotes, manage payouts, and fulfill orders.
3. **Marketplace Admin**: Governs listing approvals, onboarding/verification of suppliers, and disputes resolution.

## Authorization Controls
- **Buyer Routes**: Restricts access to roles `['Marketplace Buyer', 'Customer']`. Staff users like Super Admin or Branch Admin are blocked from shopping or managing carts on these paths by default.
- **Supplier Routes**: Restricts access to roles `['Supplier', 'Supplier Admin', 'Marketplace Supplier']`.
- **Governance Routes**: Restricted strictly to `['Super Admin', 'Marketplace Admin']`. 

## Data Validation & Enforcement
- The backend checks the user's active context role. Suppliers can only query listings matching their authenticated `supplierId`.
- Buyers are scoped to only view orders and RFQs initiated by their `customerId`/`buyerId`.
- No request-supplied IDs are trusted blindly; all database searches utilize primary key ownership links tied directly to the actor's session context.
