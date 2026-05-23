# Security Design Note: Supplier Asset Scope

**Status:** FAIL-CLOSED (Missing Schema Relation)

## Current Problem
The `IntegrationService.getAssetTimeline` endpoint currently fails closed for users with the `Supplier` role. While the endpoint is intended to provide a full lifecycle view of an asset (from RFQ to Warranty), the backend cannot currently prove which Supplier provided or is responsible for a specific Asset record.

## Why tenantId is insufficient
`tenantId` identifies the **Buyer Facility** (e.g., "City General Hospital"). It does not identify the **Supplier Organization**. Allowing a Supplier to view an asset based on `tenantId` alone would leak all assets belonging to that buyer to every supplier in the marketplace, which is a critical multi-tenant isolation failure.

## Why branchId is insufficient
In the current HMS schema, `branchId` is scoped to the Buyer's physical facility branches. Suppliers do not have a direct mapping to these branches that proves ownership of an individual Asset record.

## Required Future Schema Relation
To safely enable Supplier visibility for assets, the following schema enhancements are required:
1. **Direct Ownership:** Add `Asset.supplierOrganizationId` (UUID) to the `Asset` model.
2. **Order Link:** Ensure `SalesOrder` or `Fulfillment` records explicitly store the `supplierId` so it can be traversed in the aggregation query.
3. **Relation Mapping:**
   ```prisma
   model Asset {
     id                    String   @id @default(uuid())
     supplierOrganization  SupplierOrganization @relation(fields: [supplierOrganizationId], references: [id])
     supplierOrganizationId String
     // ...
   }
   ```

## Required Policy Rule
Once the schema is updated, the `IntegrationScopePolicy.authorizeMarketplaceEvent` must be updated to verify the user's organization context against the asset's supplier context:
```typescript
if (user.roles?.includes('Supplier')) {
  if (!asset.supplierOrganizationId || asset.supplierOrganizationId !== user.organizationId) {
    throw new ForbiddenException('access_denied: supplier_asset_scope_violation');
  }
}
```

## Current Behavior
The system **fails closed**. Any attempt by a Supplier to access the Asset Timeline results in an explicit `ForbiddenException: access_denied: supplier_asset_scope_undefined`. This prevents accidental data leakage across supplier boundaries until the schema supports secure mapping.
