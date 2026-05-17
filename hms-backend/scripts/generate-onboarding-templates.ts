import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const targetDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Service Items Template
  const serviceItemsPath = path.join(targetDir, 'service_items.csv');
  const serviceItemsContent = `# service_items template: catalog services onboarding layout
# Note: Do not alter column headers. Fields marked with * are required.
# categoryName must correspond to a valid system category (e.g., CONSULTATION, LABORATORY, RADIOLOGY).
code*,name*,description,amount*,categoryName*
CONS-001,General Consultation,Standard outpatient physician consultation fee,500.00,CONSULTATION
LAB-CBC,Complete Blood Count,Standard hematology CBC profile test,350.00,LABORATORY
RAD-CXRAY,Chest X-Ray PA View,Standard single view diagnostic radiologic exam,650.00,RADIOLOGY
`;
  fs.writeFileSync(serviceItemsPath, serviceItemsContent, 'utf8');
  console.log(`[TEMPLATE] Generated Service Items onboarding template at: ${serviceItemsPath}`);

  // 2. Inventory Items Template
  const inventoryItemsPath = path.join(targetDir, 'inventory_items.csv');
  const inventoryItemsContent = `# inventory_items template: pharmacy and supply onboarding layout
# Note: Do not alter column headers. Fields marked with * are required.
# category must be exactly DRUG or SUPPLY or EQUIPMENT.
name*,sku*,category*,unit*,reorderLevel*,price*
Paracetamol 500mg,PHAR-PARA500,DRUG,TABLET,100,1.50
Amoxicillin 500mg,PHAR-AMOX500,DRUG,CAPSULE,50,4.50
Surgical Gloves Size 7.5,SUPP-GLV75,SUPPLY,PAIR,200,15.00
`;
  fs.writeFileSync(inventoryItemsPath, inventoryItemsContent, 'utf8');
  console.log(`[TEMPLATE] Generated Inventory Items onboarding template at: ${inventoryItemsPath}`);

  console.log('\n🎉 [TEMPLATE_SUCCESS] Commercial onboarding templates generated successfully!');
  process.exit(0);
}

main();
