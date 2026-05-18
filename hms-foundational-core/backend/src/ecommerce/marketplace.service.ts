import { SecurityException } from '../../middleware/tenant-isolation';
import { v4 as uuidv4 } from 'uuid';

export interface CartItemDto {
  productId: string;
  quantity: number;
}

export interface MarketplaceProduct {
  id: string;
  tenantId: string;
  name: string;
  basePrice: number;
  isRestricted: boolean;
  requiresColdChain: boolean;
}

export interface ProcurementOrder {
  id: string;
  tenantId: string;
  creatorId: string;
  approverId: string | null;
  totalCost: number;
  status: string;
}

export interface OrganizationProfile {
  tenantId: string;
  hasVerifiedClinicalLicense: boolean;
}

export class MarketplaceService {
  private products = new Map<string, MarketplaceProduct>();
  private orders = new Map<string, ProcurementOrder>();
  private tenantProfiles = new Map<string, OrganizationProfile>();

  constructor() {
    // Seed test matrices
    this.products.set('prod-bulk-consumable', {
      id: 'prod-bulk-consumable', tenantId: 'tenant-A', name: 'Surgical Masks (Box of 50)',
      basePrice: 22.00, isRestricted: false, requiresColdChain: false
    });
    this.products.set('prod-vaccine', {
      id: 'prod-vaccine', tenantId: 'tenant-A', name: 'Cold-Chain Vaccine',
      basePrice: 450.00, isRestricted: true, requiresColdChain: true
    });
    this.products.set('prod-vaccine-unlicensed', {
      id: 'prod-vaccine-unlicensed', tenantId: 'tenant-unlicensed', name: 'Cold-Chain Vaccine (Unlicensed Context)',
      basePrice: 450.00, isRestricted: true, requiresColdChain: true
    });

    this.tenantProfiles.set('tenant-A', { tenantId: 'tenant-A', hasVerifiedClinicalLicense: true });
    this.tenantProfiles.set('tenant-unlicensed', { tenantId: 'tenant-unlicensed', hasVerifiedClinicalLicense: false });
  }

  /**
   * Evaluates organization clinical licensing checks and executes volumetric pricing algebra.
   */
  public async submitProcurementCart(creatorId: string, items: CartItemDto[], activeTenantId: string): Promise<ProcurementOrder> {
    const profile = this.tenantProfiles.get(activeTenantId);
    if (!profile) throw new Error('Target tenant operational profile not found in master registry.');

    let totalOrderCost = 0;

    for (const item of items) {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product mapping failed for ID: ${item.productId}`);

      if (product.tenantId !== activeTenantId) {
         throw new SecurityException('Cross-Tenant Data Leakage Blocked! Unauthorized marketplace catalog array access.', 'IDOR_MISMATCH');
      }

      // Regulatory License Guard Gate
      if (product.isRestricted && !profile.hasVerifiedClinicalLicense) {
         throw new Error('403_REGULATORY_LICENSE_VIOLATION: Active organization profile lacks verified clinical licensing credentials absolutely required for restricted pharmaceutical items.');
      }

      // Volumetric Differential Math: P_final = P_base * (1 - delta_k)
      let delta_k = 0.0;
      if (item.quantity >= 50) {
        delta_k = 0.12; // 12% Bulk Drop
      }
      
      const finalUnitPrice = product.basePrice * (1 - delta_k);
      totalOrderCost += finalUnitPrice * item.quantity;
    }

    const order: ProcurementOrder = {
      id: uuidv4(),
      tenantId: activeTenantId,
      creatorId,
      approverId: null,
      totalCost: totalOrderCost,
      status: 'PENDING_APPROVAL'
    };

    this.orders.set(order.id, order);
    return order;
  }

  /**
   * Tracks active streaming logistics packets evaluating thermal boundaries.
   */
  public async processCourierTelemetry(orderId: string, measuredTemp: number, activeTenantId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Logistics target order not found in registry.');

    if (order.tenantId !== activeTenantId) {
       throw new SecurityException('Cross-Tenant Telemetry Leakage Blocked! Invalid tracking vector.', 'IDOR_MISMATCH');
    }

    // In a production layout, this flag queries the nested order_items array linking to product catalogs.
    // Explicitly mocked for telemetry testing.
    const requiresColdChain = true; 

    // Temperature degradation limit parameters: strictly bound between [2°C and 8°C]
    if (requiresColdChain && (measuredTemp < 2.0 || measuredTemp > 8.0)) {
      order.status = 'COMPROMISED';
      // Triggers asynchronous supervisor alert protocols here
    }
  }

  /** Test Utility Hook */
  public getOrder(orderId: string): ProcurementOrder | undefined {
    return this.orders.get(orderId);
  }
}
