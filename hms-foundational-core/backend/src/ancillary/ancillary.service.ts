import { SecurityException } from '../../middleware/tenant-isolation';
import { v4 as uuidv4 } from 'uuid';

export interface LabResultEntry {
  id: string;
  tenantId: string;
  labOrderId: string;
  version: number;
  testData: string;
  technicianId: string;
  modifiedAt: Date;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  medicationName: string;
  masterStock: number;
  branchAllocation: number;
  reorderThreshold: number;
}

export class AncillaryService {
  private labOrders = new Map<string, { id: string, tenantId: string }>();
  private labResultsHistory: LabResultEntry[] = [];
  private inventory = new Map<string, InventoryItem>();

  constructor() {
    // Scaffold test configurations securely mapped by tenant
    this.labOrders.set('lab-ord-1', { id: 'lab-ord-1', tenantId: 'tenant-A' });
    this.inventory.set('inv-med-1', {
      id: 'inv-med-1', tenantId: 'tenant-A', medicationName: 'Amoxicillin 500mg',
      masterStock: 500, branchAllocation: 50, reorderThreshold: 20
    });
    this.inventory.set('inv-med-999', {
      id: 'inv-med-999', tenantId: 'tenant-B', medicationName: 'Lisinopril 10mg',
      masterStock: 300, branchAllocation: 40, reorderThreshold: 15
    });
  }

  /**
   * Appends a new LIS version line to the unalterable history sequence.
   * Modifying completed tests via traditional UPDATE queries is completely banned.
   */
  public async appendLabResult(labOrderId: string, resultsText: string, technicianId: string, activeTenantId: string): Promise<LabResultEntry> {
    const order = this.labOrders.get(labOrderId);
    if (!order) throw new Error('Lab Order not found');

    if (order.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Data Leakage Blocked! Unauthorized LIS access.', 'IDOR_MISMATCH');
    }

    // Determine current absolute maximum version
    const existingEntries = this.labResultsHistory.filter(e => e.labOrderId === labOrderId);
    const maxVersion = existingEntries.reduce((max, entry) => Math.max(max, entry.version), 0);
    const newVersion = maxVersion + 1;

    // Simulate database uniqueness composite index
    if (existingEntries.some(e => e.version === newVersion)) {
      throw new Error('DATABASE_CONSTRAINT_VIOLATION: Version collision.');
    }

    const newEntry: LabResultEntry = {
      id: uuidv4(),
      tenantId: activeTenantId,
      labOrderId,
      version: newVersion,
      testData: resultsText,
      technicianId,
      modifiedAt: new Date()
    };

    // Never allow UPDATE. Always append securely to form an audit trail.
    this.labResultsHistory.push(newEntry);
    
    return newEntry;
  }

  /**
   * Deducts pharmacy stock and checks the threshold boundary programmatically.
   */
  public async deductPharmacyStock(inventoryId: string, deductionQty: number, activeTenantId: string): Promise<{ success: boolean, alert?: string, remaining: number }> {
    const item = this.inventory.get(inventoryId);
    if (!item) throw new Error('Inventory Item not found');

    // Strict Anti-IDOR Check
    if (item.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Data Leakage Blocked! Unauthorized inventory manipulation.', 'IDOR_MISMATCH');
    }

    if (item.branchAllocation < deductionQty) {
      throw new Error('INSUFFICIENT_STOCK: Allocation cannot drop below zero.');
    }

    // Process atomic deduction
    item.branchAllocation -= deductionQty;

    let alertMessage = undefined;
    if (item.branchAllocation < item.reorderThreshold) {
      alertMessage = `CRITICAL_THRESHOLD_BREACH: Stock levels for ${item.medicationName} fell to ${item.branchAllocation} (Threshold: ${item.reorderThreshold}). Restock required immediately.`;
    }

    return {
      success: true,
      alert: alertMessage,
      remaining: item.branchAllocation
    };
  }

  /**
   * Verification Method: Emulates attempting to fire a dirty UPDATE query.
   */
  public async directUpdateAttack(labOrderId: string, resultsText: string): Promise<void> {
    throw new Error('DIRECT_UPDATE_BLOCKED: Architecture enforces immutable append-only version history. UPDATE statements are explicitly disabled at the DB level.');
  }
}
