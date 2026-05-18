import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateCartItemDto, SubmitOrderDto, ApproveOrderDto, CreateRFQDto, CourierTelemetryPayload } from './dto/marketplace.dto';

// In-Memory Database Simulation to execute safely and contention-free
export interface MedicalLicense {
  tenantId: string;
  hasPrescriptionClearance: boolean;
  isExpired: boolean;
  certificateNumber: string;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  basePrice: number;
  fdaTrackingNumber: string;
  ceMarking: boolean;
  isRestrictedPrescriptionOnly: boolean;
  requiresColdChain: boolean;
  isCapitalMachinery: boolean;
  stockCount: number;
  serialNumbers: string[];
}

export interface EcommerceOrder {
  id: string;
  tenantId: string;
  status: 'PENDING_INTERNAL_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LOGISTICS_TEMPERATURE_COMPROMISED';
  items: { itemId: string; quantity: number; pricePaid: number }[];
  subtotal: number;
  surcharges: number;
  total: number;
  purchaseOrderNumber?: string;
  assignedSerialNumbers?: string[];
}

export interface RFQRecord {
  id: string;
  tenantId: string;
  itemId: string;
  warrantyTier: '1-Year' | '5-Year' | 'Lifetime';
  siteReadinessDetails: string;
  leasingOption?: string;
  status: 'NEGOTIATION';
}

@Injectable()
export class MedicalMarketplaceService {
  private readonly logger = new Logger(MedicalMarketplaceService.name);

  // In-memory catalog simulating live clinical inventories
  public itemsCatalog = new Map<string, MarketplaceItem>();
  public licensesRegistry = new Map<string, MedicalLicense>();
  public ordersDb = new Map<string, EcommerceOrder>();
  public rfqsDb = new Map<string, RFQRecord>();

  constructor() {
    this.seedCatalog();
  }

  private seedCatalog() {
    // 1. Restricted cold-chain vaccines
    this.itemsCatalog.set('rx-vaccine-01', {
      id: 'rx-vaccine-01',
      name: 'BioNTech COVID-19 mRNA Vaccine Container',
      basePrice: 450.00,
      fdaTrackingNumber: 'FDA-mRNA-9921',
      ceMarking: true,
      isRestrictedPrescriptionOnly: true,
      requiresColdChain: true,
      isCapitalMachinery: false,
      stockCount: 150,
      serialNumbers: ['VAC-001', 'VAC-002', 'VAC-003', 'VAC-004']
    });

    // 2. High-ticket capital MRI machinery
    this.itemsCatalog.set('machinery-mri-01', {
      id: 'machinery-mri-01',
      name: 'GE Signa 3T MRI Scanner',
      basePrice: 1200000.00,
      fdaTrackingNumber: 'FDA-MRI-3000',
      ceMarking: true,
      isRestrictedPrescriptionOnly: false,
      requiresColdChain: false,
      isCapitalMachinery: true,
      stockCount: 2,
      serialNumbers: ['MRI-SIGNA-001']
    });

    // 3. Consumable surgical gloves (tiered bulk consumables)
    this.itemsCatalog.set('consumable-gloves-01', {
      id: 'consumable-gloves-01',
      name: 'Sterile Latex Surgical Gloves (Box)',
      basePrice: 25.00,
      fdaTrackingNumber: 'FDA-GLV-4122',
      ceMarking: true,
      isRestrictedPrescriptionOnly: false,
      requiresColdChain: false,
      isCapitalMachinery: false,
      stockCount: 1000,
      serialNumbers: []
    });

    // Seed mock Medical Licenses
    this.licensesRegistry.set('valid-hospital-tenant', {
      tenantId: 'valid-hospital-tenant',
      hasPrescriptionClearance: true,
      isExpired: false,
      certificateNumber: 'LIC-MED-99281'
    });

    this.licensesRegistry.set('unlicensed-clinic-tenant', {
      tenantId: 'unlicensed-clinic-tenant',
      hasPrescriptionClearance: false,
      isExpired: true,
      certificateNumber: 'LIC-EXP-00000'
    });
  }

  /**
   * Track A & B: Submits a cart for internal clinic review
   */
  async submitCartForApproval(tenantId: string, submitDto: SubmitOrderDto, userRole: string): Promise<EcommerceOrder> {
    this.logger.log(`Submitting B2B procurement cart for Tenant: ${tenantId}`);

    // Verify role can compile carts
    if (userRole !== 'CLINICAL_STAFF' && userRole !== 'PROCUREMENT_OFFICER') {
      throw new ForbiddenException('Only clinical staff or procurement officers can submit cart configurations.');
    }

    // Evaluate licenses & regulatory gating
    const license = this.licensesRegistry.get(tenantId);
    
    let subtotal = 0;
    let surcharges = 0;
    const orderItems: { itemId: string; quantity: number; pricePaid: number }[] = [];

    for (const cartItem of submitDto.cartItems) {
      const item = this.itemsCatalog.get(cartItem.itemId);
      if (!item) {
        throw new BadRequestException(`Item with ID ${cartItem.itemId} not found in catalog.`);
      }

      // Regulatory Gating interceptor
      if (item.isRestrictedPrescriptionOnly) {
        if (!license || license.isExpired || !license.hasPrescriptionClearance) {
          this.logger.error(`🚨 [REGULATORY_BLOCK] Tenant ${tenantId} lacks active prescription clearance for item: ${item.name}`);
          throw new ForbiddenException('403_REGULATORY_LICENSE_VIOLATION');
        }
      }

      // Check capital machinery (must route through RFQ, not standard checkout)
      if (item.isCapitalMachinery) {
        throw new BadRequestException(`Capital machinery item ${item.name} must be processed via the RFQ negotiation pipeline.`);
      }

      // Check stock limits dynamically
      if (item.stockCount < cartItem.quantity) {
        this.logger.warn(`[STOCK_SHORTAGE] Insufficient stock count for ${item.name}. Requested: ${cartItem.quantity}, Available: ${item.stockCount}`);
        throw new BadRequestException('STOCK_LIMIT_EXCEEDED');
      }

      // Calculate bulk discounts over consumables
      const basePrice = item.basePrice;
      let finalPrice = basePrice;
      
      // Tiered B2B Volume Pricing: P_final = P_base * (1 - delta_k)
      if (cartItem.quantity >= 50) {
        finalPrice = basePrice * (1 - 0.12); // 12% discount
      } else if (cartItem.quantity >= 10) {
        finalPrice = basePrice * (1 - 0.05); // 5% discount
      }

      const itemCost = finalPrice * cartItem.quantity;
      subtotal += itemCost;

      // Specialized Thermal cold-chain logistics handling surcharges
      if (item.requiresColdChain) {
        surcharges += 150.00; // Cold-Chain handling surcharge
      }

      orderItems.push({
        itemId: item.id,
        quantity: cartItem.quantity,
        pricePaid: finalPrice
      });
    }

    const orderId = `order-${crypto.randomBytes(4).toString('hex')}`;
    const order: EcommerceOrder = {
      id: orderId,
      tenantId,
      status: 'PENDING_INTERNAL_APPROVAL',
      items: orderItems,
      subtotal,
      surcharges,
      total: subtotal + surcharges,
      purchaseOrderNumber: submitDto.purchaseOrderNumber
    };

    this.ordersDb.set(orderId, order);
    this.logger.log(`🟢 [ORDER_SUBMITTED] Order ${orderId} created in state PENDING_INTERNAL_APPROVAL`);
    return order;
  }

  /**
   * Track B & C: Procurement Officer approval workflow
   */
  async approveB2BOrder(tenantId: string, approveDto: ApproveOrderDto, userRole: string): Promise<EcommerceOrder> {
    this.logger.log(`Processing procurement order approval: ${approveDto.orderId}`);

    // Verify privilege escalation guard
    if (userRole !== 'PROCUREMENT_OFFICER') {
      throw new ForbiddenException('Privilege Escalation Intercepted: Only procurement officers can finalize B2B orders.');
    }

    const order = this.ordersDb.get(approveDto.orderId);
    if (!order || order.tenantId !== tenantId) {
      throw new BadRequestException('Target B2B order not found or tenant boundaries mismatch.');
    }

    if (order.status !== 'PENDING_INTERNAL_APPROVAL') {
      throw new BadRequestException('Order status is not pending internal approval.');
    }

    // Atomic Stock Allocation and Serialization
    const allocatedSerialNumbers: string[] = [];

    // Loop through order items to deduct stock atomically
    for (const orderedItem of order.items) {
      const item = this.itemsCatalog.get(orderedItem.itemId);
      if (!item) continue;

      // Failsafe atomicity check
      if (item.stockCount < orderedItem.quantity) {
        this.logger.error(`🚨 [STOCK_COLLAPSE] Late stock shortage detected mid-approval! Transaction aborted and rolled back.`);
        throw new BadRequestException('STOCK_LIMIT_EXCEEDED');
      }

      // Deduct stock
      item.stockCount -= orderedItem.quantity;

      // Pull serial numbers if cold-chain/medical trace holds
      if (item.serialNumbers.length >= orderedItem.quantity) {
        const pulledSerials = item.serialNumbers.splice(0, orderedItem.quantity);
        allocatedSerialNumbers.push(...pulledSerials);
      }
    }

    // Finalize order status and bind metadata
    order.status = 'APPROVED';
    order.purchaseOrderNumber = approveDto.purchaseOrderNumber;
    order.assignedSerialNumbers = allocatedSerialNumbers;

    this.logger.log(`🟢 [ORDER_APPROVED] Order ${order.id} approved successfully. Serials bound: ${allocatedSerialNumbers.join(', ')}`);
    return order;
  }

  /**
   * Track C: Exclusives capital machinery RFQ pipelines
   */
  async createMachineryRFQ(tenantId: string, rfqDto: CreateRFQDto): Promise<RFQRecord> {
    this.logger.log(`Creating high-ticket capital machinery RFQ for Tenant: ${tenantId}`);

    const item = this.itemsCatalog.get(rfqDto.itemId);
    if (!item || !item.isCapitalMachinery) {
      throw new BadRequestException('RFQ channel is reserved exclusively for high-ticket capital machinery.');
    }

    const rfqId = `rfq-${crypto.randomBytes(4).toString('hex')}`;
    const rfq: RFQRecord = {
      id: rfqId,
      tenantId,
      itemId: rfqDto.itemId,
      warrantyTier: rfqDto.warrantyTier,
      siteReadinessDetails: rfqDto.siteReadinessDetails,
      leasingOption: rfqDto.leasingOption,
      status: 'NEGOTIATION'
    };

    this.rfqsDb.set(rfqId, rfq);
    this.logger.log(`🟢 [RFQ_CREATED] RFQ ${rfqId} generated for GE Signa 3T MRI Scanner under NEGOTIATION phase.`);
    return rfq;
  }

  /**
   * Track C: Thermal Drift Telemetry Hook
   */
  async handleLogisticsTelemetry(payload: CourierTelemetryPayload): Promise<EcommerceOrder> {
    this.logger.log(`Parsing logistics courier telemetry update for Order: ${payload.orderId}`);

    const order = this.ordersDb.get(payload.orderId);
    if (!order) {
      throw new BadRequestException('Target order not found.');
    }

    const temp = payload.currentTemperature;
    this.logger.log(`Courier Cold-Chain temperature check: ${temp}°C`);

    // Alert if temperature falls outside the allowed 2°C to 8°C cold-chain window
    if (temp < 2.0 || temp > 8.0) {
      this.logger.error(`🚨 [COLD_CHAIN_BREACH] Logistics thermal drift captured: ${temp}°C! Setting compromised status.`);
      order.status = 'LOGISTICS_TEMPERATURE_COMPROMISED';
    }

    return order;
  }
}
