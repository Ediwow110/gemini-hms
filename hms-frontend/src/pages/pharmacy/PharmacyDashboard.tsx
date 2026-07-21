import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Pill, AlertCircle } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsKpiStrip,
  HmsAlertRail,
  HmsWorkQueue,
  HmsDrilldownTable,
  HmsSlaPanel,
  HmsQuickActions,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
  HmsDataSourceBadge,
} from '../../components/hms-dashboard';
import { usePrescriptionQueue, useDrugCatalog, useLowStockAlerts } from '../../hooks/use-pharmacy';
import { usePermissions } from '../../hooks/use-user';
import { RequirePermission } from '../../components/ui/RequirePermission';

export const PharmacyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canDispense = hasPermission('inventory.stock.dispense');

  const { data: prescriptionQueue, isLoading: queueLoading, isFetching: queueFetching, error: queueError, refetch: refetchQueue } = usePrescriptionQueue();
  const { data: drugCatalog, isLoading: catalogLoading, isFetching: catalogFetching, error: catalogError, refetch: refetchCatalog } = useDrugCatalog();
  const { data: lowStockAlerts, isLoading: alertsLoading, isFetching: alertsFetching, error: alertsError, refetch: refetchAlerts } = useLowStockAlerts();

  const isLoading = queueLoading || catalogLoading || alertsLoading;
  const errorObj = queueError || catalogError || alertsError;

  const refresh = async () => {
    await Promise.all([refetchQueue(), refetchCatalog(), refetchAlerts()]);
  };

  if (errorObj && !isLoading) {
    return (
      <HmsDashboardShell>
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">Failed to load pharmacy dashboard data.</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  // ── Derived KPIs ──
  const queue = prescriptionQueue ?? [];
  const catalog = drugCatalog ?? [];
  const alerts = lowStockAlerts ?? [];

  const totalInventory = catalog.length;
  const lowStockItems = catalog.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel);
  const outOfStockItems = catalog.filter(item => item.quantity === 0);
  const dispenseQueueCount = queue.length;

  // ── KPIs for strip ──
  const kpis = [
    {
      id: 'inventory',
      label: 'Total Inventory',
      value: totalInventory,
      severity: 'info' as const,
    },
    {
      id: 'low-stock',
      label: 'Low Stock',
      value: lowStockItems.length,
      severity: lowStockItems.length > 5 ? 'critical' as const : lowStockItems.length > 0 ? 'warning' as const : 'success' as const,
    },
    {
      id: 'out-of-stock',
      label: 'Out of Stock',
      value: outOfStockItems.length,
      severity: outOfStockItems.length > 0 ? 'critical' as const : 'success' as const,
    },
    {
      id: 'dispense-queue',
      label: 'Dispense Queue',
      value: dispenseQueueCount,
      severity: dispenseQueueCount > 10 ? 'warning' as const : 'info' as const,
    },
  ];

  // ── Alerts from low stock ──
  const railAlerts = alerts.slice(0, 3).map(alert => ({
    id: alert.id,
    severity: (alert.quantity === 0 ? 'critical' : 'warning') as 'critical' | 'warning' | 'success',
    title: `Low Stock: ${alert.inventoryItem.name}`,
    message: `${alert.quantity} remaining (reorder at ${alert.reorderLevel})`,
    timestamp: 'Real-time',
  }));

  // ── Prescription queue items ──
  const prescriptionItems = queue.slice(0, 8).map(item => ({
    id: item.id,
    patientName: item.patientName,
    patientNumber: item.patientNumber,
    medicationName: item.medicationName,
    dosage: item.dosage,
    frequency: item.frequency,
    prescribedBy: item.prescribedBy,
    prescribedByName: item.prescribedByName,
  }));

  // ── Lowest stock items ──
  const lowestStockItems = [...catalog]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
    .map(item => ({
      id: item.id,
      label: item.name,
      value: item.quantity,
    }));

  // ── SLA items ──
  const totalQueue = dispenseQueueCount;
  const outOfStockCount = outOfStockItems.length;
  const slaItems = [
    {
      id: 'sla-queue',
      label: 'Dispense Queue Backlog',
      value: totalQueue,
      status: (totalQueue > 5 ? 'at_risk' : 'on_track') as 'at_risk' | 'on_track' | 'breached',
      drilldownHref: canDispense ? '/pharmacy' : undefined,
    },
    {
      id: 'sla-stockout',
      label: 'Critical Stockouts',
      value: outOfStockCount,
      status: (outOfStockCount > 0 ? 'breached' : 'on_track') as 'at_risk' | 'on_track' | 'breached',
      drilldownHref: canDispense ? '/pharmacy' : undefined,
    },
  ];

  const lastUpdated = new Date();

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          role="Pharmacy Dashboard"
          lastRefreshed={lastUpdated}
          onRefresh={() => void refresh()}
          refreshing={queueFetching || catalogFetching || alertsFetching}
        />
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={lastUpdated}
          dataSource="Live Inventory/Pharmacy API"
        />
      }
    >
      <HmsPageHeader
        eyebrow="Medication operations"
        title="Pharmacy Workspace"
        description="Dispensing demand, stock risk and pharmacy actions centered on the current branch workflow."
        actions={<HmsDataSourceBadge mode="live" />}
      />

      {/* Top Alert Rail for Stock Risks */}
      <HmsAlertRail alerts={railAlerts} loading={isLoading} />

      {/* KPI Strip */}
      <HmsKpiStrip metrics={kpis} loading={isLoading} />

      {isLoading ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="table" />
          </div>
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <HmsLoadingSkeleton variant="panel" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Main Work Content (8/12 cols desktop, 12 cols tablet/mobile) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            {/* Active Prescriptions Queue */}
            {prescriptionItems.length > 0 ? (
              <HmsWorkQueue
                title="Prescriptions Waiting Dispense"
                description="Active queue of prescription orders awaiting pharmacist fulfillment"
                data={prescriptionItems}
                keyExtractor={(item) => item.id}
                columns={[
                  {
                    key: 'patient',
                    header: 'Patient',
                    render: (item) => (
                      <div>
                        <div className="font-semibold text-slate-800">{item.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.patientNumber}</div>
                      </div>
                    )
                  },
                  {
                    key: 'medication',
                    header: 'Medication / Rx',
                    render: (item) => (
                      <div>
                        <span className="font-semibold text-slate-800">{item.medicationName}</span>
                        <span className="ml-2 text-slate-400 font-mono text-[11px]">({item.dosage} / {item.frequency})</span>
                      </div>
                    )
                  },
                  {
                    key: 'prescribedBy',
                    header: 'Prescribed By',
                    render: (item) => <span className="text-slate-600">{item.prescribedByName || item.prescribedBy}</span>
                  },
                  {
                    key: 'action',
                    header: '',
                    width: 'w-20',
                    render: () => (
                      <RequirePermission permission="inventory.stock.dispense">
                        <button
                          type="button"
                          onClick={() => navigate('/pharmacy')}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 focus:underline"
                        >
                          Dispense →
                        </button>
                      </RequirePermission>
                    )
                  }
                ]}
                emptyMessage="No prescriptions currently waiting in the active queue"
                maxRows={5}
                viewAllLink={canDispense ? '/pharmacy' : undefined}
                viewAllLabel="Open Dispense Hub"
              />
            ) : (
              <HmsDataUnavailable
                sectionName="Prescriptions Waiting Dispense"
                expectedApi="/v1/pharmacy/prescriptions"
                expectedPhase="No active prescriptions"
              />
            )}

            {/* Lowest Stock Items */}
            {lowestStockItems.length > 0 ? (
              <HmsDrilldownTable
                title="Lowest Stock Items"
                description="Inventory items at critical levels or facing stock-outs"
                data={lowestStockItems}
                keyExtractor={(item) => item.id}
                columns={[
                  {
                    key: 'medication',
                    header: 'Medication',
                    render: (item) => <span className="font-semibold text-slate-800">{item.label}</span>
                  },
                  {
                    key: 'stock',
                    header: 'Current Stock',
                    render: (item) => (
                      <span className={`font-mono font-bold ${Number(item.value) === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {item.value}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        Number(item.value) === 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {Number(item.value) === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </span>
                    )
                  }
                ]}
                emptyMessage="All tracked inventory levels are healthy"
                maxRows={5}
                viewAllLink={canDispense ? '/pharmacy' : undefined}
                viewAllLabel="Open Inventory Manager"
              />
            ) : (
              <HmsDataUnavailable
                sectionName="Lowest Stock Items"
                expectedApi="/v1/inventory/catalog"
                expectedPhase="No low stock items"
              />
            )}

            {/* Near Expiry — Unavailable */}
            <HmsDataUnavailable
              sectionName="Medication Near Expiry"
              expectedApi="/api/v1/inventory/alerts/expiry"
              expectedPhase="Phase 2"
            />

            {/* Stock Anomalies — Unavailable */}
            <HmsDataUnavailable
              sectionName="Stock Discrepancies & Anomalies"
              expectedApi="/api/v1/inventory/alerts/anomalies"
              expectedPhase="Phase 2"
            />
          </div>

          {/* Operational Metrics and Quick Actions (4/12 cols desktop, 12 cols tablet/mobile) */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            {/* SLA Risk Panel */}
            <HmsSlaPanel
              title="Operational Risks"
              items={slaItems}
            />

            {/* Top Dispensed Meds — Unavailable */}
            <HmsDataUnavailable
              sectionName="Top Dispensed Medications"
              expectedApi="/api/v1/pharmacy/analytics/top-dispensed"
              expectedPhase="Phase 2"
            />

            {/* Dispensing Throughput — Unavailable */}
            <HmsDataUnavailable
              sectionName="Dispensing Throughput (7d)"
              expectedApi="/api/v1/pharmacy/analytics/throughput"
              expectedPhase="Phase 2"
            />

            {/* Quick Actions */}
            <HmsQuickActions
              title="Quick Actions"
              actions={[
                { id: 'disp-hub', label: 'Dispense Queue', icon: <Pill className="h-4 w-4 text-blue-500" />, href: '/pharmacy', permission: 'inventory.stock.dispense' },
                { id: 'inv-mgr', label: 'Drug Inventory', icon: <Package className="h-4 w-4 text-emerald-500" />, href: '/pharmacy', permission: 'inventory.stock.dispense' },
              ]}
            />
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default PharmacyDashboard;
