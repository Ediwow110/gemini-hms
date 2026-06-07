import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Pill, AlertCircle } from 'lucide-react';
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
} from '../../components/hms-dashboard';
import { pharmacyDashboardService } from '../../services/pharmacy-dashboard.service';
import type { PharmacyDashboardData } from '../../services/pharmacy-dashboard.service';

export const PharmacyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PharmacyDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchId = selectedBranch === 'all' ? 'main-branch' : selectedBranch;
      const result = await pharmacyDashboardService.getDashboardData(branchId);
      setData(result);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load pharmacy dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchData();
  }, [selectedBranch]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">{error}</h2>
          <button
            onClick={() => fetchData()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map alerts to AlertRail format
  const railAlerts = data?.alerts.map((alert) => ({
    id: alert.id,
    severity: (alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'success') 
      ? alert.severity 
      : 'warning' as const,
    title: alert.title,
    message: alert.message,
    timestamp: 'Real-time',
  })) || [];

  // Map KPIs to KpiStrip format
  const kpis = data?.kpis.map((kpi, idx) => ({
    id: `kpi-${idx}`,
    label: kpi.title,
    value: kpi.value,
    severity: (kpi.severity === 'info' || kpi.severity === 'success' || kpi.severity === 'warning' || kpi.severity === 'critical')
      ? kpi.severity
      : 'info' as const,
  })) || [];

  // Get lowest stock items
  const lowestStockData = data?.lowestStock || [];
  
  // Calculate SLA values
  const totalQueue = data?.activePrescriptions?.length ?? 0;
  const outOfStockCount = lowestStockData.filter(i => Number(i.value) === 0).length;

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={selectedBranch === 'all' ? 'All Branches' : selectedBranch}
          role="Pharmacy Dashboard"
          lastRefreshed={lastUpdated}
          onRefresh={fetchData}
        >
          <div className="flex items-center gap-2">
            <label htmlFor="branch-select" className="text-[11px] font-medium text-slate-400">Select Branch:</label>
            <select
              id="branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Branches</option>
              <option value="main-branch">Main Branch</option>
              <option value="north-clinic">North Branch</option>
            </select>
          </div>
        </HmsToolbar>
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={lastUpdated}
          dataSource={data?.isUnavailable ? 'Live source unavailable' : 'Live Inventory/Pharmacy API'}
        />
      }
    >
      {data?.isUnavailable && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span className="text-[12px] font-semibold text-rose-700">Live dashboard data could not be loaded — showing unavailable state for unsupported sections</span>
          </div>
          <span className="text-[10px] font-bold text-rose-600 font-mono">OFFLINE</span>
        </div>
      )}

      {/* Top Alert Rail for Stock Risks */}
      <HmsAlertRail alerts={railAlerts} loading={loading} />

      {/* KPI Strip */}
      {data?.isUnavailable ? (
        <HmsDataUnavailable
          sectionName="Inventory & Dispense Key Metrics"
          expectedApi="/v1/inventory/catalog, /v1/pharmacy/prescriptions"
        />
      ) : (
        <HmsKpiStrip metrics={kpis} loading={loading} />
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="table" />
          </div>
          <div className="space-y-3">
            <HmsLoadingSkeleton variant="panel" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Work Content (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Active Prescriptions Queue */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Prescriptions Waiting Dispense"
                expectedApi="/v1/pharmacy/prescriptions"
              />
            ) : (
              <HmsWorkQueue
                title="Prescriptions Waiting Dispense"
                description="Active queue of prescription orders awaiting pharmacist fulfillment"
                data={data?.activePrescriptions || []}
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
                      <button
                        type="button"
                        onClick={() => navigate('/pharmacy')}
                        className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 focus:underline"
                      >
                        Dispense →
                      </button>
                    )
                  }
                ]}
                emptyMessage="No prescriptions currently waiting in the active queue"
                maxRows={5}
                viewAllLink="/pharmacy"
                viewAllLabel="Open Dispense Hub"
              />
            )}

            {/* Lowest Stock Items */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Lowest Stock Items"
                expectedApi="/v1/inventory/catalog"
              />
            ) : (
              <HmsDrilldownTable
                title="Lowest Stock Items"
                description="Inventory items at critical levels or facing stock-outs"
                data={lowestStockData}
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
                viewAllLink="/pharmacy/inventory"
                viewAllLabel="Open Inventory Manager"
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

          {/* Operational Metrics and Quick Actions (1/3) */}
          <div className="space-y-3">
            {/* SLA Risk Panel */}
            {data?.isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Operational Risks"
                expectedApi="/v1/pharmacy/prescriptions, /v1/inventory/catalog"
              />
            ) : (
              <HmsSlaPanel
                title="Operational Risks"
                items={[
                  {
                    id: 'sla-queue',
                    label: 'Dispense Queue Backlog',
                    value: totalQueue,
                    status: totalQueue > 5 ? 'at_risk' : 'on_track',
                    drilldownHref: '/pharmacy',
                  },
                  {
                    id: 'sla-stockout',
                    label: 'Critical Stockouts',
                    value: outOfStockCount,
                    status: outOfStockCount > 0 ? 'breached' : 'on_track',
                    drilldownHref: '/pharmacy/inventory',
                  }
                ]}
              />
            )}

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
                { id: 'disp-hub', label: 'Dispense Queue', icon: <Pill className="h-4 w-4 text-blue-500" />, href: '/pharmacy' },
                { id: 'inv-mgr', label: 'Drug Inventory', icon: <Package className="h-4 w-4 text-emerald-500" />, href: '/pharmacy/inventory' },
              ]}
            />
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default PharmacyDashboard;
