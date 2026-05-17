import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceRow {
  code: string;
  name: string;
  description: string;
  amount: number;
  categoryName: string;
}

interface InventoryRow {
  name: string;
  sku: string;
  category: string; // DRUG, SUPPLY, EQUIPMENT
  unit: string;
  reorderLevel: number;
  price: number;
}

function parseCsv(filePath: string): string[][] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/);
  const dataLines: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue; // Skip comments and empty lines
    }
    // Simple robust CSV line splitter that handles basic commas
    const cols = trimmed.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    dataLines.push(cols);
  }
  return dataLines;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId');
  const branchId = getArg('--branchId');
  let servicesCsv = getArg('--servicesCsv');
  let inventoryCsv = getArg('--inventoryCsv');

  if (!tenantId || !branchId) {
    console.error('Usage: npx tsx scripts/import-clinic-catalogs.ts --tenantId <UUID> --branchId <UUID> [--servicesCsv <path>] [--inventoryCsv <path>]');
    process.exit(1);
  }

  // Fallbacks to default template locations
  if (!servicesCsv) {
    servicesCsv = path.join(__dirname, 'templates/service_items.csv');
  }
  if (!inventoryCsv) {
    inventoryCsv = path.join(__dirname, 'templates/inventory_items.csv');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`📦 METRO HEALTH BULK CATALOG INGESTION ENGINE`);
  console.log(`================================================================================`);
  console.log(`Tenant:         ${tenantId}`);
  console.log(`Branch:         ${branchId}`);
  console.log(`Services CSV:   ${servicesCsv}`);
  console.log(`Inventory CSV:  ${inventoryCsv}`);
  console.log(`================================================================================\n`);

  try {
    // 1. Verify files exist before transaction start
    if (!fs.existsSync(servicesCsv)) {
      throw new Error(`Services CSV file not found at: ${servicesCsv}`);
    }
    if (!fs.existsSync(inventoryCsv)) {
      throw new Error(`Inventory CSV file not found at: ${inventoryCsv}`);
    }

    // 2. Parse and Validate Services CSV Row-by-Row
    console.log('[INGEST] Parsing and validating Services catalog...');
    const serviceLines = parseCsv(servicesCsv);
    if (serviceLines.length < 2) {
      throw new Error('Services CSV is empty or has no header.');
    }

    const serviceHeaders = serviceLines[0].map(h => h.replace('*', '').toLowerCase());
    const serviceRows: ServiceRow[] = [];

    for (let i = 1; i < serviceLines.length; i++) {
      const cols = serviceLines[i];
      if (cols.length < serviceHeaders.length) {
        throw new Error(`Services CSV Line ${i + 4} is malformed (columns count mismatch).`);
      }

      const rowMap: any = {};
      serviceHeaders.forEach((header, idx) => {
        rowMap[header] = cols[idx];
      });

      // Validations
      if (!rowMap.code) throw new Error(`Services CSV Line ${i + 4}: code field is required.`);
      if (!rowMap.name) throw new Error(`Services CSV Line ${i + 4}: name field is required.`);
      if (!rowMap.categoryname) throw new Error(`Services CSV Line ${i + 4}: categoryName field is required.`);
      
      const amount = parseFloat(rowMap.amount);
      if (isNaN(amount) || amount < 0) {
        throw new Error(`Services CSV Line ${i + 4}: amount must be a non-negative number.`);
      }

      serviceRows.push({
        code: rowMap.code,
        name: rowMap.name,
        description: rowMap.description || '',
        amount,
        categoryName: rowMap.categoryname,
      });
    }
    console.log(`[INGEST] Successfully validated ${serviceRows.length} Services rows.`);

    // 3. Parse and Validate Inventory CSV Row-by-Row
    console.log('[INGEST] Parsing and validating Inventory catalog...');
    const inventoryLines = parseCsv(inventoryCsv);
    if (inventoryLines.length < 2) {
      throw new Error('Inventory CSV is empty or has no header.');
    }

    const inventoryHeaders = inventoryLines[0].map(h => h.replace('*', '').toLowerCase());
    const inventoryRows: InventoryRow[] = [];

    const allowedCategories = ['DRUG', 'SUPPLY', 'EQUIPMENT'];

    for (let i = 1; i < inventoryLines.length; i++) {
      const cols = inventoryLines[i];
      if (cols.length < inventoryHeaders.length) {
        throw new Error(`Inventory CSV Line ${i + 4} is malformed (columns count mismatch).`);
      }

      const rowMap: any = {};
      inventoryHeaders.forEach((header, idx) => {
        rowMap[header] = cols[idx];
      });

      // Validations
      if (!rowMap.name) throw new Error(`Inventory CSV Line ${i + 4}: name field is required.`);
      if (!rowMap.sku) throw new Error(`Inventory CSV Line ${i + 4}: sku field is required.`);
      if (!rowMap.unit) throw new Error(`Inventory CSV Line ${i + 4}: unit field is required.`);
      
      const category = rowMap.category ? rowMap.category.toUpperCase() : '';
      if (!allowedCategories.includes(category)) {
        throw new Error(`Inventory CSV Line ${i + 4}: category must be exactly one of: ${allowedCategories.join(', ')} (got: "${category}").`);
      }

      const reorderLevel = parseInt(rowMap.reorderlevel, 10);
      if (isNaN(reorderLevel) || reorderLevel < 0) {
        throw new Error(`Inventory CSV Line ${i + 4}: reorderLevel must be a non-negative integer.`);
      }

      const price = parseFloat(rowMap.price);
      if (isNaN(price) || price < 0) {
        throw new Error(`Inventory CSV Line ${i + 4}: price must be a non-negative number.`);
      }

      inventoryRows.push({
        name: rowMap.name,
        sku: rowMap.sku,
        category,
        unit: rowMap.unit,
        reorderLevel,
        price,
      });
    }
    console.log(`[INGEST] Successfully validated ${inventoryRows.length} Inventory rows.`);

    // 4. Atomic Transactional Database Ingestion
    console.log('\n[TRANSACTION] Initializing database transactional commit...');
    await prisma.$transaction(async (tx) => {
      // A. Verify Tenant and Branch exist
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error(`Tenant ID "${tenantId}" does not exist.`);

      const branch = await tx.branch.findFirst({ where: { id: branchId, tenantId } });
      if (!branch) throw new Error(`Branch ID "${branchId}" does not exist under tenant.`);

      // Get tenant's admin user to sign creations
      const creator = await tx.user.findFirst({ where: { tenantId } });
      if (!creator) throw new Error(`No admin user exists to sign entries for tenant "${tenantId}".`);

      // B. Process and Save Service Items (Idempotent Upserts)
      console.log('  ├─ Ingesting/Updating Service Catalog...');
      for (const row of serviceRows) {
        // Find or create category
        let category = await tx.serviceCategory.findFirst({
          where: { tenantId, name: row.categoryName },
        });

        if (!category) {
          category = await tx.serviceCategory.create({
            data: {
              tenantId,
              name: row.categoryName,
              createdBy: creator.id,
              updatedBy: creator.id,
            },
          });
        }

        let serviceItem = await tx.serviceItem.findFirst({
          where: { tenantId, code: row.code },
        });

        if (serviceItem) {
          serviceItem = await tx.serviceItem.update({
            where: { id: serviceItem.id },
            data: {
              name: row.name,
              description: row.description,
              categoryId: category.id,
              updatedBy: creator.id,
            },
          });
          
          // Update price for this branch
          const existingPrice = await tx.servicePrice.findFirst({
            where: { tenantId, serviceItemId: serviceItem.id, branchId },
          });

          if (existingPrice) {
            await tx.servicePrice.update({
              where: { id: existingPrice.id },
              data: {
                amount: row.amount,
                updatedBy: creator.id,
              },
            });
          } else {
            await tx.servicePrice.create({
              data: {
                tenantId,
                serviceItemId: serviceItem.id,
                branchId,
                amount: row.amount,
                isActive: true,
                createdBy: creator.id,
                updatedBy: creator.id,
              },
            });
          }
        } else {
          serviceItem = await tx.serviceItem.create({
            data: {
              tenantId,
              categoryId: category.id,
              code: row.code,
              name: row.name,
              description: row.description,
              isActive: true,
              createdBy: creator.id,
              updatedBy: creator.id,
            },
          });

          await tx.servicePrice.create({
            data: {
              tenantId,
              serviceItemId: serviceItem.id,
              branchId,
              amount: row.amount,
              isActive: true,
              createdBy: creator.id,
              updatedBy: creator.id,
            },
          });
        }
      }

      // C. Process and Save Inventory Items (Idempotent Upserts)
      console.log('  ├─ Ingesting/Updating Pharmacy Inventory Catalog & Branch Stocks...');
      for (const row of inventoryRows) {
        let invItem = await tx.inventoryItem.findFirst({
          where: { tenantId, sku: row.sku },
        });

        if (invItem) {
          invItem = await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: {
              name: row.name,
              category: row.category,
              unit: row.unit,
              reorderLevel: row.reorderLevel,
              price: row.price,
            },
          });

          const branchStock = await tx.branchStock.findFirst({
            where: { tenantId, branchId, inventoryItemId: invItem.id },
          });

          if (branchStock) {
            await tx.branchStock.update({
              where: { id: branchStock.id },
              data: {
                reorderLevel: row.reorderLevel,
              },
            });
          } else {
            await tx.branchStock.create({
              data: {
                tenantId,
                branchId,
                inventoryItemId: invItem.id,
                quantity: 0,
                reorderLevel: row.reorderLevel,
              },
            });
          }
        } else {
          invItem = await tx.inventoryItem.create({
            data: {
              tenantId,
              name: row.name,
              sku: row.sku,
              category: row.category,
              unit: row.unit,
              reorderLevel: row.reorderLevel,
              currentStock: 0,
              price: row.price,
              status: 'ACTIVE',
            },
          });

          await tx.branchStock.create({
            data: {
              tenantId,
              branchId,
              inventoryItemId: invItem.id,
              quantity: 0,
              reorderLevel: row.reorderLevel,
            },
          });
        }
      }
    });

    console.log(`\n🎉 [INGEST_SUCCESS] Price and Pharmacy catalogs successfully committed to the database!`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [INGEST_FAILED] Catalog transaction aborted:`, error.message);
    console.error('All database modifications were successfully rolled back completely.');
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
