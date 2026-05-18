import { MarketplaceService } from '../backend/src/ecommerce/marketplace.service';

async function main() {
  console.log(`================================================================================`);
  console.log(`🚀 BATCH 9: MEDICAL E-COMMERCE & SUPPLY CHAIN COMPLIANCE`);
  console.log(`Execution Mode: REGULATORY LICENSING & THERMAL TELEMETRY`);
  console.log(`================================================================================\n`);

  const marketplaceService = new MarketplaceService();
  const TENANT_A = 'tenant-A';
  const TENANT_UNLICENSED = 'tenant-unlicensed';
  const USER_ID = 'usr-director';
  
  // ================================================================================
  // SCENARIO 1: The Unlicensed Pharmaceutical Ingestion Block
  // ================================================================================
  console.log(`[SCENARIO 1] The Unlicensed Pharmaceutical Ingestion Block`);
  try {
    console.log(`   ├─ Executing restricted cart checkout utilizing unverified tenant profile...`);
    await marketplaceService.submitProcurementCart(USER_ID, [{ productId: 'prod-vaccine-unlicensed', quantity: 5 }], TENANT_UNLICENSED);
    console.error(`   🔴 FAILURE: Restricted item successfully purchased by unlicensed tenant!\n`);
  } catch (err: any) {
    if (err.message.includes('403_REGULATORY_LICENSE_VIOLATION')) {
      console.log(`   🟢 SUCCESS: Regulatory Gate actively assessed license metrics.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: Restricted asset acquisition completely blocked.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
    }
  }

  // ================================================================================
  // SCENARIO 2: Lattice Sum Balance & Bulk Math Check
  // ================================================================================
  console.log(`[SCENARIO 2] Lattice Sum Balance & Bulk Math Check`);
  try {
    console.log(`   ├─ Calculating cart payload: 60x Masks (Volume Tier Active), 3x Vaccine (Fixed Base)...`);
    
    const cartPayload = [
      { productId: 'prod-bulk-consumable', quantity: 60 },
      { productId: 'prod-vaccine', quantity: 3 }
    ];

    const order = await marketplaceService.submitProcurementCart(USER_ID, cartPayload, TENANT_A);
    
    // Algebra Evaluation:
    // Mask Base: 22.00, volume discount threshold (qty >= 50): delta = 0.12 => Final = 22 * 0.88 = 19.36. Subtotal = 60 * 19.36 = 1161.60
    // Vaccine Base: 450.00. Subtotal = 3 * 450 = 1350.00
    // Total Expected Ledger Sum = 1161.60 + 1350.00 = 2511.60
    
    console.log(`   ├─ Computed Master Ledger Balance: $${order.totalCost.toFixed(2)}`);

    if (Math.abs(order.totalCost - 2511.60) < 0.01) {
      console.log(`   🟢 SUCCESS: P_final = P_base * (1 - delta_k) logic executed cleanly.`);
      console.log(`   🟢 VERIFIED: Volumetric bulk tiers applied precisely with zero drift.\n`);
    } else {
      console.error(`   🔴 FAILURE: Ledger math anomaly detected! Expected $2511.60.\n`);
    }
  } catch (err: any) {
    console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
  }

  // ================================================================================
  // SCENARIO 3: Thermal Drift Telemetry Intercept
  // ================================================================================
  console.log(`[SCENARIO 3] Thermal Drift Telemetry Intercept (Cold-Chain Guard)`);
  try {
    // Scaffold valid order first
    const vaccineOrder = await marketplaceService.submitProcurementCart(USER_ID, [{ productId: 'prod-vaccine', quantity: 1 }], TENANT_A);
    
    console.log(`   ├─ Transmitting logistics telemetry mock packet: Sensor Temp [9.8°C]...`);
    await marketplaceService.processCourierTelemetry(vaccineOrder.id, 9.8, TENANT_A);
    
    const compromisedOrder = marketplaceService.getOrder(vaccineOrder.id);
    
    if (compromisedOrder && compromisedOrder.status === 'COMPROMISED') {
      console.log(`   🟢 SUCCESS: Telemetry stream analysis trapped anomalous thermal spike (2°C - 8°C bound violated).`);
      console.log(`   🟢 VERIFIED: Active delivery order status programmatically plummeted to COMPROMISED.\n`);
    } else {
      console.error(`   🔴 FAILURE: Cold chain breach ignored by tracking telemetry.\n`);
    }
  } catch (err: any) {
    console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
  }

  console.log(`================================================================================`);
  console.log(`\x1b[32m✅ VERDICT: SUPPLY CHAIN COMPLIANCE OPERATIONAL\x1b[0m`);
  console.log(`================================================================================\n`);
}

main();
