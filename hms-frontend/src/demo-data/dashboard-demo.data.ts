/** Demo chart data used by dashboard services when real aggregation APIs are unavailable.
 *  Replace these imports with real API calls once aggregation endpoints exist. */
export const demoData = {
  billing: {
    paymentMethodDistribution: [
      { label: 'Cash', value: 60 },
      { label: 'Credit Card', value: 25 },
      { label: 'Insurance', value: 15 },
    ],
  },
  lab: {
    workloadDistribution: [
      { label: 'Hematology', value: 45 },
      { label: 'Chemistry', value: 30 },
      { label: 'Microbiology', value: 15 },
      { label: 'Other', value: 10 },
    ],
    topRequestedTests: [
      { id: 't1', label: 'CBC', value: '420', trend: '+5%' },
      { id: 't2', label: 'Comprehensive Metabolic Panel', value: '310', trend: '+2%' },
      { id: 't3', label: 'HbA1c', value: '150', trend: '-10%' },
    ],
  },
  pharmacy: {
    categoryDistribution: [
      { label: 'Antibiotics', value: 40 },
      { label: 'Analgesics', value: 30 },
      { label: 'Cardiovascular', value: 20 },
      { label: 'Others', value: 10 },
    ],
    topDispensed: [
      { id: 'td-1', label: 'Paracetamol 500mg', value: '1,240', trend: '+12%' },
      { id: 'td-2', label: 'Amoxicillin 250mg', value: '850', trend: '+5%' },
      { id: 'td-3', label: 'Metformin 500mg', value: '620', trend: '-2%' },
    ],
  },
  clinicalOps: {
    workloadDistribution: [
      { label: 'General Practice', value: 40 },
      { label: 'Pediatrics', value: 25 },
      { label: 'Internal Medicine', value: 20 },
      { label: 'Urgent Care', value: 15 },
    ],
    topDepartments: [
      { id: 'd1', label: 'Emergency', value: 'High', trend: '↑' },
      { id: 'd2', label: 'Pediatrics', value: 'Medium', trend: '→' },
      { id: 'd3', label: 'General', value: 'Medium', trend: '↓' },
    ],
  },
};
