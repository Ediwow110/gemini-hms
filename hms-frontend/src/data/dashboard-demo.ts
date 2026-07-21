import type {
  HeatmapCell,
  Insight,
  StatusBreakdown,
  TrendPoint,
} from '../types/analytics';

export type DashboardDemoMode = 'off' | 'fallback' | 'force';

const parseMode = (value: string | undefined): DashboardDemoMode => {
  if (value === 'off' || value === 'fallback' || value === 'force') return value;
  return import.meta.env.DEV ? 'fallback' : 'off';
};

const parsedSeed = Number(import.meta.env.VITE_DASHBOARD_DEMO_SEED ?? 20260710);

export const dashboardDemoConfig = {
  mode: parseMode(import.meta.env.VITE_DASHBOARD_DEMO_MODE),
  seed: Number.isFinite(parsedSeed) ? parsedSeed : 20260710,
  profile: import.meta.env.VITE_DASHBOARD_DEMO_PROFILE ?? 'normal',
} as const;

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const createRandom = (namespace: number) =>
  mulberry32(dashboardDemoConfig.seed ^ namespace);

const integer = (random: () => number, min: number, max: number) =>
  Math.round(min + random() * (max - min));

const money = (random: () => number, min: number, max: number) =>
  Math.round((min + random() * (max - min)) / 100) * 100;

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const trend = (
  random: () => number,
  labels: string[],
  start: number,
  growth: number,
  variance: number,
): TrendPoint[] =>
  labels.map((label, index) => ({
    label,
    value: Math.max(
      0,
      Math.round(start + index * growth + (random() - 0.5) * variance),
    ),
  }));

const dualTrend = (
  random: () => number,
  labels: string[],
  primaryStart: number,
  primaryGrowth: number,
  secondaryStart: number,
  secondaryGrowth: number,
): TrendPoint[] =>
  labels.map((label, index) => ({
    label,
    value: Math.max(
      0,
      Math.round(primaryStart + index * primaryGrowth + (random() - 0.5) * 8),
    ),
    secondaryValue: Math.max(
      0,
      Math.round(secondaryStart + index * secondaryGrowth + (random() - 0.5) * 5),
    ),
  }));

const hrRandom = createRandom(101);
const itRandom = createRandom(202);
const marketplaceRandom = createRandom(303);
const complianceRandom = createRandom(404);
const branchRandom = createRandom(505);
const fieldRandom = createRandom(606);
const financeRandom = createRandom(707);
const adminRandom = createRandom(808);
const supplierRandom = createRandom(909);

export const demoSupplierDashboard = {
  metrics: {
    activeListings: integer(supplierRandom, 14, 24),
    pendingRfqs: integer(supplierRandom, 3, 8),
    pendingOrders: integer(supplierRandom, 4, 11),
    warrantyClaims: integer(supplierRandom, 1, 4),
    revenue: money(supplierRandom, 4_800_000, 7_200_000),
    pendingPayout: money(supplierRandom, 900_000, 1_900_000),
  },
  revenueTrend: trend(supplierRandom, monthLabels, 3_600_000, 520_000, 720_000),
  statusBreakdown: [
    { label: 'Listings', value: integer(supplierRandom, 14, 24) },
    { label: 'Orders', value: integer(supplierRandom, 4, 11) },
    { label: 'Shipped', value: integer(supplierRandom, 18, 32) },
    { label: 'Claims', value: integer(supplierRandom, 1, 4) },
  ] satisfies StatusBreakdown[],
  insights: [
    {
      title: 'RFQ response window is tightening',
      description: 'Three synthetic RFQs are within six hours of their buyer response deadline.',
      severity: 'warning',
      actionLabel: 'Open RFQ inbox',
      actionTo: '/supplier/rfq-inbox',
    },
    {
      title: 'Fulfillment remains within target',
      description: 'The synthetic scenario shows 94% of supplier orders shipped inside the committed window.',
      severity: 'success',
      actionLabel: 'Open fulfillment',
      actionTo: '/supplier/fulfillment',
    },
  ] satisfies Insight[],
};

export const demoAdminDashboard = {
  summary: {
    activePatients: integer(adminRandom, 820, 1240),
    todaysAppointments: integer(adminRandom, 140, 230),
    pendingLabs: integer(adminRandom, 18, 42),
    lowStock: integer(adminRandom, 4, 11),
    revenue: money(adminRandom, 1_200_000, 1_900_000),
    securityAlerts: integer(adminRandom, 1, 4),
  },
  tenants: [
    { id: 'demo-tenant-1', name: 'Central Health Network', status: 'ACTIVE', userCount: 146, branchCount: 4 },
    { id: 'demo-tenant-2', name: 'NorthCare Clinics', status: 'ACTIVE', userCount: 82, branchCount: 3 },
    { id: 'demo-tenant-3', name: 'Apex Diagnostic Group', status: 'ACTIVE', userCount: 48, branchCount: 2 },
    { id: 'demo-tenant-4', name: 'Community Medical Center', status: 'DEGRADED', userCount: 64, branchCount: 2 },
  ],
  patientVolumeTrend: trend(adminRandom, dayLabels, 146, 5, 38),
  revenueTrend: trend(adminRandom, dayLabels, 165_000, 12_000, 72_000),
  securityBreakdown: [
    { label: 'Informational', value: integer(adminRandom, 24, 38) },
    { label: 'Warning', value: integer(adminRandom, 6, 13) },
    { label: 'Critical', value: integer(adminRandom, 1, 4) },
  ] satisfies StatusBreakdown[],
  branchVolume: [
    { label: 'Central Hospital', value: integer(adminRandom, 180, 240) },
    { label: 'North Clinic', value: integer(adminRandom, 95, 150) },
    { label: 'South Ambulatory', value: integer(adminRandom, 70, 125) },
    { label: 'Diagnostic Center', value: integer(adminRandom, 55, 92) },
  ] satisfies TrendPoint[],
  alerts: [
    {
      id: 'demo-admin-alert-1',
      severity: 'critical' as const,
      title: 'Security review required',
      message: 'Two high-risk access events are awaiting compliance review.',
      timestamp: '12 min ago',
    },
    {
      id: 'demo-admin-alert-2',
      severity: 'warning' as const,
      title: 'Low-stock exposure',
      message: 'Four high-use inventory items are below their branch reorder point.',
      timestamp: '28 min ago',
    },
  ],
  unpaidBills: [
    { id: 'DEMO-INV-2048', label: 'DEMO-INV-2048', value: money(adminRandom, 120_000, 220_000) },
    { id: 'DEMO-INV-2042', label: 'DEMO-INV-2042', value: money(adminRandom, 80_000, 160_000) },
    { id: 'DEMO-INV-2039', label: 'DEMO-INV-2039', value: money(adminRandom, 55_000, 120_000) },
    { id: 'DEMO-INV-2032', label: 'DEMO-INV-2032', value: money(adminRandom, 30_000, 90_000) },
  ],
  insights: [
    {
      title: 'One tenant needs operational follow-up',
      description: 'The synthetic scenario marks Community Medical Center as degraded after repeated integration latency.',
      severity: 'warning',
      actionLabel: 'Open tenant management',
      actionTo: '/admin/tenants',
    },
    {
      title: 'Revenue is tracking above the weekly baseline',
      description: 'Synthetic collections are 8% above the prior-period scenario without a matching refund spike.',
      severity: 'success',
      actionLabel: 'Open reports',
      actionTo: '/admin/reports',
    },
  ] satisfies Insight[],
};

export const demoHrDashboard = {
  metrics: {
    headcount: integer(hrRandom, 118, 146),
    pendingLeave: integer(hrRandom, 5, 12),
    expiredLicenses: integer(hrRandom, 1, 4),
    staffingGap: integer(hrRandom, 4, 9),
  },
  headcountTrend: trend(hrRandom, monthLabels, 112, 5, 6),
  attendanceTrend: trend(hrRandom, dayLabels, 91, 0.6, 5),
  leaveBreakdown: [
    { label: 'Vacation', value: integer(hrRandom, 12, 21) },
    { label: 'Sick', value: integer(hrRandom, 7, 14) },
    { label: 'Emergency', value: integer(hrRandom, 2, 7) },
    { label: 'Training', value: integer(hrRandom, 3, 8) },
  ] satisfies StatusBreakdown[],
  staffingGap: [
    { label: 'Emergency', value: integer(hrRandom, 3, 7) },
    { label: 'Nursing', value: integer(hrRandom, 2, 6) },
    { label: 'Laboratory', value: integer(hrRandom, 1, 4) },
    { label: 'Radiology', value: integer(hrRandom, 1, 3) },
    { label: 'Billing', value: integer(hrRandom, 0, 2) },
  ] satisfies TrendPoint[],
  payrollTrend: trend(hrRandom, monthLabels, 7_800_000, 145_000, 260_000),
  employees: [
    {
      id: 'demo-employee-1',
      name: 'Ariana Santos',
      email: 'ariana.santos@example.invalid',
      role: 'Charge Nurse',
      department: 'Nursing',
      branch: 'Central Hospital',
      status: 'ACTIVE' as const,
      rawStatus: 'ACTIVE' as const,
      joinedAt: '2024-02-12',
    },
    {
      id: 'demo-employee-2',
      name: 'Miguel Reyes',
      email: 'miguel.reyes@example.invalid',
      role: 'Medical Technologist',
      department: 'Laboratory',
      branch: 'Central Hospital',
      status: 'ACTIVE' as const,
      rawStatus: 'ACTIVE' as const,
      joinedAt: '2023-08-21',
    },
    {
      id: 'demo-employee-3',
      name: 'Leah Navarro',
      email: 'leah.navarro@example.invalid',
      role: 'Radiologic Technologist',
      department: 'Radiology',
      branch: 'North Clinic',
      status: 'ON_LEAVE' as const,
      rawStatus: 'ON_LEAVE' as const,
      joinedAt: '2025-01-06',
    },
    {
      id: 'demo-employee-4',
      name: 'Noel Garcia',
      email: 'noel.garcia@example.invalid',
      role: 'Billing Specialist',
      department: 'Billing',
      branch: 'Central Hospital',
      status: 'ACTIVE' as const,
      rawStatus: 'ACTIVE' as const,
      joinedAt: '2026-06-18',
    },
  ],
  leaveRequests: [
    {
      id: 'demo-leave-1',
      employeeName: 'Leah Navarro',
      type: 'SICK',
      startDate: '2026-07-11',
      endDate: '2026-07-13',
      days: 3,
      status: 'PENDING',
    },
    {
      id: 'demo-leave-2',
      employeeName: 'Ariana Santos',
      type: 'ANNUAL',
      startDate: '2026-07-20',
      endDate: '2026-07-22',
      days: 3,
      status: 'PENDING',
    },
  ],
  licenses: [
    {
      id: 'demo-license-1',
      employeeName: 'Miguel Reyes',
      type: 'Medical Technologist',
      licenseNumber: 'DEMO-MT-10482',
      expiryDate: '2026-08-02',
      daysRemaining: 23,
      status: 'EXPIRING' as const,
    },
    {
      id: 'demo-license-2',
      employeeName: 'Ariana Santos',
      type: 'Registered Nurse',
      licenseNumber: 'DEMO-RN-77214',
      expiryDate: '2027-03-18',
      daysRemaining: 251,
      status: 'VALID' as const,
    },
  ],
  insights: [
    {
      title: 'Nursing coverage is tight',
      description:
        'Two evening shifts are below the configured staffing target in the synthetic scenario.',
      severity: 'warning',
      actionLabel: 'Review staffing',
      actionTo: '/hr/employees',
    },
    {
      title: 'License renewal window',
      description:
        'Three clinical credentials enter the 30-day renewal window this month.',
      severity: 'critical',
      actionLabel: 'Open licenses',
      actionTo: '/hr/licenses',
    },
  ] satisfies Insight[],
};

export const demoItDashboard = {
  metrics: {
    activeSessions: integer(itRandom, 38, 72),
    healthyIntegrations: integer(itRandom, 9, 14),
    backupFailures: integer(itRandom, 0, 2),
    systemLatencyMs: integer(itRandom, 38, 82),
  },
  latencyTrend: dualTrend(itRandom, dayLabels, 58, -1, 99, 0),
  jobStatus: [
    { label: 'Completed', value: integer(itRandom, 120, 170) },
    { label: 'Running', value: integer(itRandom, 4, 11) },
    { label: 'Retrying', value: integer(itRandom, 1, 4) },
    { label: 'Failed', value: integer(itRandom, 0, 2) },
  ] satisfies StatusBreakdown[],
  tickets: [
    {
      id: 'DEMO-IT-1042',
      userName: 'Dr. Elena Cruz',
      userEmail: 'elena.cruz@example.invalid',
      userRole: 'Doctor',
      tenantName: 'Demo Hospital Network',
      branchName: 'Central Hospital',
      issueType: 'MFA_RESET',
      summary: 'Replacement phone requires MFA enrollment reset.',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: '12 minutes ago',
    },
    {
      id: 'DEMO-IT-1041',
      userName: 'Marco Villanueva',
      userEmail: 'marco.villanueva@example.invalid',
      userRole: 'Cashier',
      tenantName: 'Demo Hospital Network',
      branchName: 'North Clinic',
      issueType: 'SESSION_LOCKOUT',
      summary: 'Repeated sign-in attempts locked the workstation session.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdAt: '36 minutes ago',
    },
  ],
  jobs: [
    {
      id: 'demo-job-1',
      name: 'audit_integrity_check',
      type: 'CRON' as const,
      status: 'COMPLETED' as const,
      schedule: '0 */4 * * *',
      lastRun: '18 minutes ago',
      nextRun: 'in 3h 42m',
      duration: '14.2s',
      retryCount: 0,
      description: 'Verifies the audit hash chain and signature coverage.',
    },
    {
      id: 'demo-job-2',
      name: 'notification_dispatch',
      type: 'QUEUE' as const,
      status: 'RUNNING' as const,
      lastRun: 'now',
      duration: '2.8s',
      retryCount: 0,
      description: 'Delivers pending email and SMS notifications.',
    },
    {
      id: 'demo-job-3',
      name: 'claims_reconciliation',
      type: 'BATCH' as const,
      status: 'FAILED' as const,
      schedule: '30 1 * * *',
      lastRun: '6 hours ago',
      nextRun: 'in 18h',
      duration: '41.7s',
      retryCount: 2,
      description: 'Matches HMO claim responses to submitted invoices.',
    },
  ],
  insights: [
    {
      title: 'Peak latency at shift change',
      description:
        'Synthetic telemetry shows a short latency increase between 07:00 and 08:00.',
      severity: 'warning',
      actionLabel: 'Open system health',
      actionTo: '/it/system-health',
    },
    {
      title: 'Backups within policy',
      description: 'The latest database and object-storage backup checks completed.',
      severity: 'success',
      actionLabel: 'Review backups',
      actionTo: '/it/backup-restore',
    },
  ] satisfies Insight[],
};

export const demoMarketplaceDashboard = {
  metrics: {
    gmv: money(marketplaceRandom, 4_800_000, 7_200_000),
    totalOrders: integer(marketplaceRandom, 310, 470),
    approvedListings: integer(marketplaceRandom, 88, 126),
    revenue: money(marketplaceRandom, 280_000, 460_000),
  },
  gmvTrend: trend(marketplaceRandom, monthLabels, 720_000, 92_000, 180_000),
  ordersByCategory: [
    { label: 'Diagnostics', value: integer(marketplaceRandom, 72, 110) },
    { label: 'Consumables', value: integer(marketplaceRandom, 115, 170) },
    { label: 'Imaging', value: integer(marketplaceRandom, 35, 68) },
    { label: 'Monitoring', value: integer(marketplaceRandom, 44, 79) },
    { label: 'Mobility', value: integer(marketplaceRandom, 18, 42) },
  ] satisfies TrendPoint[],
  supplierPerformance: [
    { label: 'MediSource', value: integer(marketplaceRandom, 93, 99) },
    { label: 'Careline', value: integer(marketplaceRandom, 90, 97) },
    { label: 'Apex Medical', value: integer(marketplaceRandom, 87, 95) },
    { label: 'Northstar', value: integer(marketplaceRandom, 82, 92) },
  ] satisfies TrendPoint[],
  disputes: [
    { label: 'Delivery', value: integer(marketplaceRandom, 4, 10) },
    { label: 'Product', value: integer(marketplaceRandom, 2, 7) },
    { label: 'Billing', value: integer(marketplaceRandom, 1, 5) },
    { label: 'Warranty', value: integer(marketplaceRandom, 1, 4) },
  ] satisfies StatusBreakdown[],
  warrantyTrend: trend(marketplaceRandom, dayLabels, 5, 0.2, 5),
  insights: [
    {
      title: 'One supplier below SLA',
      description:
        'Northstar Medical is below the 90% delivery target in the synthetic scenario.',
      severity: 'warning',
      actionLabel: 'Review suppliers',
      actionTo: '/marketplace/admin/suppliers',
    },
    {
      title: 'GMV growth remains healthy',
      description: 'Six-month synthetic GMV is trending upward without a dispute spike.',
      severity: 'success',
    },
  ] satisfies Insight[],
};

export const demoComplianceDashboard = {
  metrics: {
    totalAuditEvents: integer(complianceRandom, 12_000, 18_000),
    securityAlerts: integer(complianceRandom, 1, 4),
    complianceScore: integer(complianceRandom, 91, 98),
  },
  phiAccessTrend: dualTrend(complianceRandom, dayLabels, 860, 24, 7, 0),
  statusBreakdown: [
    { label: 'Effective', value: integer(complianceRandom, 42, 54) },
    { label: 'Review due', value: integer(complianceRandom, 5, 10) },
    { label: 'At risk', value: integer(complianceRandom, 1, 4) },
  ] satisfies StatusBreakdown[],
  phiEvents: [
    {
      id: 'demo-phi-1',
      timestamp: '10 Jul 2026, 09:42',
      actorName: 'Clinical User A',
      actorRole: 'Doctor',
      patientName: 'Synthetic Patient One',
      patientId: 'DEMO-PAT-1001',
      tenantName: 'Demo Hospital Network',
      branchName: 'Central Hospital',
      accessType: 'ROUTINE' as const,
      reason: 'PATIENT_CHART_VIEWED',
      riskScore: 12,
    },
    {
      id: 'demo-phi-2',
      timestamp: '10 Jul 2026, 09:18',
      actorName: 'Emergency User B',
      actorRole: 'Emergency Physician',
      patientName: 'Synthetic Patient Two',
      patientId: 'DEMO-PAT-1002',
      tenantName: 'Demo Hospital Network',
      branchName: 'North Clinic',
      accessType: 'EMERGENCY' as const,
      reason: 'BREAK_GLASS_ACCESS',
      riskScore: 68,
    },
    {
      id: 'demo-phi-3',
      timestamp: '10 Jul 2026, 08:53',
      actorName: 'Unknown Session',
      actorRole: 'Unresolved',
      patientName: 'Synthetic Patient Three',
      patientId: 'DEMO-PAT-1003',
      tenantName: 'Demo Hospital Network',
      branchName: 'Central Hospital',
      accessType: 'UNAUTHORIZED' as const,
      reason: 'ACCESS_SCOPE_MISMATCH',
      riskScore: 92,
    },
  ],
  insights: [
    {
      title: 'Two access reviews are due',
      description:
        'Quarterly privileged-access reviews are approaching their synthetic due date.',
      severity: 'warning',
      actionLabel: 'Open access reviews',
      actionTo: '/compliance/access-reviews',
    },
    {
      title: 'Audit chain verified',
      description: 'No integrity breaks were generated in the current synthetic scenario.',
      severity: 'success',
      actionLabel: 'Review audit chain',
      actionTo: '/compliance/audit-review',
    },
  ] satisfies Insight[],
};

export const demoBranchDashboard = {
  patientVolumeByHour: trend(
    branchRandom,
    ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
    18,
    5,
    18,
  ),
  queueByDepartment: [
    { label: 'Emergency', value: integer(branchRandom, 12, 26) },
    { label: 'Laboratory', value: integer(branchRandom, 8, 18) },
    { label: 'Imaging', value: integer(branchRandom, 4, 13) },
    { label: 'Billing', value: integer(branchRandom, 3, 9) },
  ] satisfies StatusBreakdown[],
  roomOccupancy: [
    { label: 'Emergency', value: integer(branchRandom, 76, 96) },
    { label: 'Ward A', value: integer(branchRandom, 65, 88) },
    { label: 'Ward B', value: integer(branchRandom, 54, 82) },
    { label: 'Imaging', value: integer(branchRandom, 42, 74) },
  ] satisfies TrendPoint[],
  staffWorkload: [
    ['Emergency', 'Morning', integer(branchRandom, 72, 96)],
    ['Emergency', 'Evening', integer(branchRandom, 62, 90)],
    ['Laboratory', 'Morning', integer(branchRandom, 58, 82)],
    ['Laboratory', 'Evening', integer(branchRandom, 44, 76)],
    ['Billing', 'Morning', integer(branchRandom, 35, 66)],
    ['Billing', 'Evening', integer(branchRandom, 28, 58)],
  ].map(([row, column, value]) => ({ row, column, value })) as HeatmapCell[],
};

export const demoFieldServiceDashboard = {
  completionTrend: trend(fieldRandom, dayLabels, 9, 0.7, 7),
  statusBreakdown: [
    { label: 'Assigned', value: integer(fieldRandom, 8, 16) },
    { label: 'In progress', value: integer(fieldRandom, 4, 11) },
    { label: 'Completed', value: integer(fieldRandom, 18, 30) },
    { label: 'At risk', value: integer(fieldRandom, 1, 5) },
  ] satisfies StatusBreakdown[],
  slaByType: [
    { label: 'Delivery', value: integer(fieldRandom, 88, 98) },
    { label: 'Installation', value: integer(fieldRandom, 84, 96) },
    { label: 'Maintenance', value: integer(fieldRandom, 80, 94) },
  ] satisfies TrendPoint[],
};

export const demoFinanceDashboard = {
  revenueTrend: trend(financeRandom, dayLabels, 145_000, 9_000, 45_000),
  paymentMethods: [
    { label: 'Cash', value: integer(financeRandom, 28, 42) },
    { label: 'Card', value: integer(financeRandom, 20, 36) },
    { label: 'HMO', value: integer(financeRandom, 16, 29) },
    { label: 'Bank', value: integer(financeRandom, 8, 18) },
  ] satisfies StatusBreakdown[],
};

export const shouldUseDashboardDemo = (
  hasLiveData: boolean,
  hasLiveError: boolean,
) =>
  dashboardDemoConfig.mode === 'force' ||
  (dashboardDemoConfig.mode === 'fallback' && (!hasLiveData || hasLiveError));
