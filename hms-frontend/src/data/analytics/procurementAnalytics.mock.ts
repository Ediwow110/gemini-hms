import { Clock, PackageCheck, Send, ShoppingBag, Truck, WalletCards } from 'lucide-react';
import type { AnalyticsMetric, FunnelStep, Insight, ReportColumn, ReportRow, TrendPoint } from '../../types/analytics';

export const procurementMetrics: AnalyticsMetric[] = [
  { title: 'Open PRs', value: 21, icon: ShoppingBag, description: '6 urgent clinical requests', trend: { value: '+5', direction: 'negative' }, severity: 'warning', href: '/procurement/purchase-requests' },
  { title: 'RFQs Awaiting Supplier', value: 8, icon: Send, description: 'Quotes not yet received', trend: { value: '+2', direction: 'negative' }, severity: 'warning', href: '/procurement/rfqs' },
  { title: 'POs Awaiting Delivery', value: 12, icon: PackageCheck, description: '4 due today', trend: { value: 'stable', direction: 'neutral' }, severity: 'info', href: '/procurement/purchase-orders' },
  { title: 'Delayed Deliveries', value: 4, icon: Clock, description: 'Potential clinical stockout impact', trend: { value: '+1', direction: 'negative' }, severity: 'critical', href: '/procurement/receiving' },
  { title: 'Budget Used', value: '72%', icon: WalletCards, description: 'Q2 consumables budget', trend: { value: '+9%', direction: 'negative' }, severity: 'warning' },
  { title: 'Vendor SLA', value: '94.1%', icon: Truck, description: 'Average on-time performance', trend: { value: '-1.2%', direction: 'negative' }, severity: 'info', href: '/procurement/vendor-performance' },
];

export const procurementFunnel: FunnelStep[] = [
  { label: 'Purchase requests', value: 42, description: 'Submitted and awaiting approval' },
  { label: 'RFQs issued', value: 28, description: 'Supplier bidding stage' },
  { label: 'POs created', value: 18, description: 'Committed purchase orders' },
  { label: 'Received', value: 14, description: 'Stock arrived and posted' },
];

export const spendByCategory: TrendPoint[] = [
  { label: 'Lab', value: 1.8 }, { label: 'Pharma', value: 2.4 }, { label: 'PPE', value: 0.8 }, { label: 'Imaging', value: 1.2 }, { label: 'Facilities', value: 0.6 },
];

export const supplierSlaComparison: TrendPoint[] = [
  { label: 'Apex', value: 98 }, { label: 'Global', value: 92 }, { label: 'MedLine', value: 89 }, { label: 'CarePro', value: 96 },
];

export const deliveryDelayTrend: TrendPoint[] = [
  { label: 'W1', value: 2 }, { label: 'W2', value: 4 }, { label: 'W3', value: 3 }, { label: 'W4', value: 5 },
];

export const procurementInsights: Insight[] = [
  { title: 'CBC reagent PR is urgent', description: 'Two urgent lab reagent requests could block specimen processing within 48 hours.', severity: 'critical', actionLabel: 'Open PR Queue', actionTo: '/procurement/purchase-requests' },
  { title: 'Supplier response lag', description: 'RFQ response time rose to 2.4 days; invite backup vendors for lab consumables.', severity: 'warning', actionLabel: 'Review RFQs', actionTo: '/procurement/rfqs' },
  { title: 'Apex remains preferred for urgent PO', description: 'Apex Medical has the highest SLA among high-volume suppliers.', severity: 'success', actionLabel: 'Vendor Performance', actionTo: '/procurement/vendor-performance' },
];

export const urgentPurchaseRows: ReportRow[] = [
  { id: 'PR-1001', request: 'CBC Reagents (Bulk)', category: 'Laboratory', priority: 'Urgent', status: 'Pending approval', age: '8h' },
  { id: 'PR-1003', request: 'MRI Cooling Helium', category: 'Maintenance', priority: 'Urgent', status: 'RFQ needed', age: '11h' },
  { id: 'PO-441', request: 'Medical Grade Consumables', category: 'Consumables', priority: 'High', status: 'Delivery due today', age: '2d' },
];

export const urgentPurchaseColumns: ReportColumn[] = [
  { key: 'request', header: 'Request', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'priority', header: 'Priority', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'age', header: 'Age' },
];
