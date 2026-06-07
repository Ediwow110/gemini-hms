import type { TrendPoint, StatusBreakdown } from '../types/analytics';

/**
 * MOCK DATA for Admin/Executive Dashboard
 * This data is purely synthetic and used for UI/UX validation only.
 * DO NOT use for production logic.
 */

export const ADMIN_DASHBOARD_MOCK = {
  kpis: [
    {
      title: 'Active Patients',
      value: '12,450',
      description: 'Patients with encounters in last 30 days',
      trend: { direction: 'positive' as const, value: '+12%', label: 'vs last month' },
      severity: 'info' as const,
      icon: 'Users',
      href: '/patients',
    },
    {
      title: "Today's Appointments",
      value: '142',
      description: 'Scheduled across all branches',
      trend: { direction: 'neutral' as const, value: 'Stable', label: 'vs average' },
      severity: 'success' as const,
      icon: 'Calendar',
      href: '/appointments',
    },
    {
      title: 'Pending Labs',
      value: '28',
      description: 'Awaiting validation/release',
      trend: { direction: 'negative' as const, value: '+5', label: 'since morning' },
      severity: 'warning' as const,
      icon: 'FlaskConical',
      href: '/lab/pending',
    },
    {
      title: 'Low Stock Items',
      value: '14',
      description: 'Items below reorder level',
      trend: { direction: 'negative' as const, value: 'Critical', label: 'needs refill' },
      severity: 'critical' as const,
      icon: 'Package',
      href: '/pharmacy/inventory',
    },
    {
      title: 'Unpaid Revenue',
      value: '$45,200',
      description: 'Outstanding invoices total',
      trend: { direction: 'negative' as const, value: '+2%', label: 'vs target' },
      severity: 'warning' as const,
      icon: 'DollarSign',
      href: '/billing/unpaid',
    },
    {
      title: 'Security Alerts',
      value: '3',
      description: 'High-risk audit events (24h)',
      trend: { direction: 'neutral' as const, value: 'Low', label: 'risk level' },
      severity: 'critical' as const,
      icon: 'ShieldAlert',
      href: '/audit/logs',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      title: 'Critical Stock Shortage',
      message: 'Insulin Glargine is below safety stock in Main Branch.',
      severity: 'critical' as const,
      timestamp: '10 mins ago',
      actionLabel: 'Reorder Now',
      actionHref: '/pharmacy/orders/new',
    },
    {
      id: 'alert-2',
      title: 'Pending Approval',
      message: 'Refund request for Invoice #INV-2026-001 awaits your review.',
      severity: 'warning' as const,
      timestamp: '1 hour ago',
      actionLabel: 'Review Request',
      actionHref: '/admin/approvals',
    },
    {
      id: 'alert-3',
      title: 'Abnormal Lab Result',
      message: 'Critical Potassium level detected for Sample Patient 001.',
      severity: 'critical' as const,
      timestamp: '2 hours ago',
      actionLabel: 'View Result',
      actionHref: '/clinical/lab-results/res-123',
    },
  ],
  trends: {
    patientVolume: [
      { label: 'Mon', value: 120, secondaryValue: 110 },
      { label: 'Tue', value: 150, secondaryValue: 140 },
      { label: 'Wed', value: 130, secondaryValue: 120 },
      { label: 'Thu', value: 170, secondaryValue: 150 },
      { label: 'Fri', value: 160, secondaryValue: 140 },
      { label: 'Sat', value: 90, secondaryValue: 80 },
      { label: 'Sun', value: 70, secondaryValue: 60 },
    ] as TrendPoint[],
    revenue: [
      { label: 'Week 1', value: 45000, secondaryValue: 40000 },
      { label: 'Week 2', value: 52000, secondaryValue: 48000 },
      { label: 'Week 3', value: 48000, secondaryValue: 42000 },
      { label: 'Week 4', value: 61000, secondaryValue: 55000 },
    ] as TrendPoint[],
  },
  distributions: {
    deptWorkload: [
      { label: 'Pediatrics', value: 45, severity: 'info' },
      { label: 'Cardiology', value: 25, severity: 'success' },
      { label: 'Orthopedics', value: 30, severity: 'warning' },
      { label: 'General', value: 60, severity: 'critical' },
      { label: 'Neurology', value: 20, severity: 'info' },
    ] as StatusBreakdown[],
    branchComparison: [
      { label: 'Main Branch', value: 1200 },
      { label: 'East Wing', value: 800 },
      { label: 'West Clinic', value: 600 },
      { label: 'North Center', value: 400 },
    ] as TrendPoint[],
  },
  topLists: {
    unpaidBills: [
      { id: '1', label: 'Corp Health Plan', value: '$12,000', trend: 'Overdue 30d', drillDownUrl: '/billing/invoices/inv-1' },
      { id: '2', label: 'Anonymous Client A', value: '$4,500', trend: 'Overdue 15d', drillDownUrl: '/billing/invoices/inv-2' },
      { id: '3', label: 'HMO North', value: '$3,200', trend: 'Pending', drillDownUrl: '/billing/invoices/inv-3' },
      { id: '4', label: 'City Insurance', value: '$2,100', trend: 'Pending', drillDownUrl: '/billing/invoices/inv-4' },
      { id: '5', label: 'Anonymous Client B', value: '$1,800', trend: 'Overdue 10d', drillDownUrl: '/billing/invoices/inv-5' },
    ],
    busiestDepts: [
      { id: 'd1', label: 'General Medicine', value: '42%', trend: 'High Load', drillDownUrl: '/admin/departments/general' },
      { id: 'd2', label: 'Pediatrics', value: '28%', trend: 'Stable', drillDownUrl: '/admin/departments/peds' },
      { id: 'd3', label: 'Cardiology', value: '15%', trend: 'Increasing', drillDownUrl: '/admin/departments/cardio' },
      { id: 'd4', label: 'Orthopedics', value: '10%', trend: 'Low', drillDownUrl: '/admin/departments/ortho' },
      { id: 'd5', label: 'Neurology', value: '5%', trend: 'Stable', drillDownUrl: '/admin/departments/neuro' },
    ],
  },
};
