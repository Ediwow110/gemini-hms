import { BadgeDollarSign, FileWarning, PackageSearch, ShieldAlert, ShoppingBag, Truck, Users, Wrench } from 'lucide-react';
import type { AnalyticsMetric, Insight, ReportColumn, ReportRow, StatusBreakdown, TrendPoint } from '../../types/analytics';

export const marketplaceAdminMetrics: AnalyticsMetric[] = [
  { title: 'Pending Suppliers', value: 7, icon: Users, description: 'Credential checks queued', trend: { value: '+2', direction: 'negative' }, severity: 'warning', href: '/marketplace-admin/suppliers' },
  { title: 'Listing Approvals', value: 12, icon: PackageSearch, description: '4 high-priority devices', trend: { value: '+3', direction: 'negative' }, severity: 'warning', href: '/marketplace-admin/listing-approval' },
  { title: 'Open Disputes', value: 5, icon: ShieldAlert, description: '2 warranty-related', trend: { value: '+2', direction: 'negative' }, severity: 'critical', href: '/marketplace-admin/disputes' },
  { title: 'GMV', value: '₱18.2M', icon: BadgeDollarSign, description: 'Sandbox gross volume', trend: { value: '+15.4%', direction: 'positive' }, severity: 'success', href: '/marketplace-admin/reports' },
  { title: 'Commission Revenue', value: '₱845K', icon: ShoppingBag, description: 'Estimated platform fees', trend: { value: '+8.3%', direction: 'positive' }, severity: 'success', href: '/marketplace-admin/commission-fees' },
  { title: 'Fulfillment SLA', value: '97.8%', icon: Truck, description: 'Install + delivery target', trend: { value: '+0.5%', direction: 'positive' }, severity: 'success', href: '/marketplace-admin/fulfillment-monitor' },
  { title: 'Warranty Claim Rate', value: '2.1%', icon: Wrench, description: 'Claims per fulfilled order', trend: { value: '-0.4%', direction: 'positive' }, severity: 'info', href: '/marketplace-admin/warranty-claims' },
];

export const gmvTrend: TrendPoint[] = [
  { label: 'Jan', value: 10.4 }, { label: 'Feb', value: 12.2 }, { label: 'Mar', value: 14.8 }, { label: 'Apr', value: 16.6 }, { label: 'May', value: 18.2 },
];

export const ordersByCategory: TrendPoint[] = [
  { label: 'Devices', value: 42 }, { label: 'Lab', value: 28 }, { label: 'PPE', value: 63 }, { label: 'Service', value: 18 },
];

export const supplierRanking: TrendPoint[] = [
  { label: 'Apex', value: 98 }, { label: 'Global', value: 91 }, { label: 'MedLine', value: 87 }, { label: 'CarePro', value: 96 },
];

export const disputesByType: StatusBreakdown[] = [
  { label: 'Delivery', value: 2, color: '#f59e0b' },
  { label: 'Warranty', value: 2, color: '#e11d48' },
  { label: 'Billing', value: 1, color: '#4f46e5' },
];

export const warrantyClaimsTrend: TrendPoint[] = [
  { label: 'W1', value: 2 }, { label: 'W2', value: 4 }, { label: 'W3', value: 3 }, { label: 'W4', value: 8 },
];

export const marketplaceInsights: Insight[] = [
  { title: 'Warranty dispute cluster', description: 'Two open disputes reference the same supplier device family; hold related listings for manual review.', severity: 'critical', actionLabel: 'Open Disputes', actionTo: '/marketplace-admin/disputes' },
  { title: 'Listing queue aging', description: 'Four high-priority listings are older than SLA. Prioritize devices used by active procurement requests.', severity: 'warning', actionLabel: 'Listing Approval', actionTo: '/marketplace-admin/listing-approval' },
  { title: 'GMV growth is supplier-led', description: 'Apex and CarePro account for most sandbox volume growth; monitor concentration risk.', severity: 'info', actionLabel: 'Reports', actionTo: '/marketplace-admin/reports' },
];

export const marketplaceQueueRows: ReportRow[] = [
  { id: 'SUP-12', item: 'Apex Medical Corp', queue: 'Supplier approval', age: '18h', risk: 'Low', owner: 'Marketplace Ops' },
  { id: 'LST-41', item: 'Portable Ultrasound V2', queue: 'Listing approval', age: '2d', risk: 'Medium', owner: 'Clinical reviewer' },
  { id: 'DSP-08', item: 'Warranty non-response', queue: 'Dispute', age: '11h', risk: 'High', owner: 'Governance' },
];

export const marketplaceQueueColumns: ReportColumn[] = [
  { key: 'item', header: 'Item', sortable: true },
  { key: 'queue', header: 'Queue', sortable: true },
  { key: 'age', header: 'Age' },
  { key: 'risk', header: 'Risk', sortable: true },
  { key: 'owner', header: 'Owner', sortable: true },
];

export const marketplaceReportRows: ReportRow[] = [
  { id: 'CAT-DEV', category: 'Devices', gmv: '₱8.4M', orders: 42, disputes: 2, sla: '96%' },
  { id: 'CAT-LAB', category: 'Lab Supplies', gmv: '₱4.2M', orders: 28, disputes: 1, sla: '98%' },
  { id: 'CAT-PPE', category: 'PPE', gmv: '₱2.8M', orders: 63, disputes: 0, sla: '99%' },
];

export const marketplaceReportColumns: ReportColumn[] = [
  { key: 'category', header: 'Category', sortable: true },
  { key: 'gmv', header: 'GMV' },
  { key: 'orders', header: 'Orders', sortable: true },
  { key: 'disputes', header: 'Disputes', sortable: true },
  { key: 'sla', header: 'SLA' },
];

export const supplierPerformanceMetrics: AnalyticsMetric[] = [
  { title: 'Open Orders', value: 18, icon: ShoppingBag, description: 'Supplier work queue', trend: { value: '+4', direction: 'positive' }, severity: 'info', href: '/supplier/orders' },
  { title: 'Payouts Pending', value: '₱420K', icon: BadgeDollarSign, description: 'Requires settlement window', trend: { value: 'WIP', direction: 'neutral' }, severity: 'warning', href: '/supplier/payouts' },
  { title: 'SLA Breaches', value: 2, icon: FileWarning, description: 'Delivery commitments missed', trend: { value: '+1', direction: 'negative' }, severity: 'critical', href: '/supplier/performance' },
];
