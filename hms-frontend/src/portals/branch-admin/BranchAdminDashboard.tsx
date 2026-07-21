import React from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
} from '../../components/hms-dashboard';
import { BranchAdminShellNotice } from './components/BranchAdminShellNotice';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  HeatmapGrid,
  InsightPanel,
  ReportTable,
  StatusDonutChart,
  VolumeAreaChart,
} from '../../components/analytics';
import {
  branchInsights,
  branchMetrics,
  delayedPatientColumns,
  delayedPatientRows,
} from '../../data/analytics/branchAnalytics.mock';
import { demoBranchDashboard } from '../../data/dashboard-demo';

export const BranchAdminDashboard: React.FC = () => (
  <HmsDashboardShell
    footer={<HmsAuditFooter dataSource="Synthetic branch operations scenario" />}
  >
    <HmsPageHeader
      eyebrow="Branch operations"
      title="Branch Operations Command Center"
      description="Patient flow, queue delays, room utilization and staffing pressure in one decision-focused view."
      actions={<HmsDataSourceBadge mode="demo" />}
    />

    <BranchAdminShellNotice />

    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {branchMetrics.map((metric) => (
        <AnalyticsMetricCard key={metric.title} {...metric} />
      ))}
    </div>

    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-8">
        <ChartCard
          title="Patient demand by hour"
          description="Synthetic arrival pattern used to review queue and staffing layout."
          emphasis="primary"
        >
          <VolumeAreaChart
            data={demoBranchDashboard.patientVolumeByHour}
            title="Patient demand by hour"
            valueLabel="Arrivals"
          />
        </ChartCard>
      </div>
      <div className="col-span-12 xl:col-span-4">
        <InsightPanel insights={branchInsights} title="Decisions requiring attention" />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <ReportTable
          columns={delayedPatientColumns}
          rows={delayedPatientRows}
          caption="Synthetic delayed-patient drilldown"
        />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <ChartCard
          title="Queue mix"
          description="Where patients are currently waiting in the synthetic scenario."
        >
          <StatusDonutChart
            data={demoBranchDashboard.queueByDepartment}
            title="Queue mix by department"
          />
        </ChartCard>
      </div>

      <div className="col-span-12 xl:col-span-6">
        <ChartCard
          title="Room occupancy"
          description="Utilization by service area; values are percentages."
        >
          <ComparisonBarChart
            data={demoBranchDashboard.roomOccupancy}
            title="Room occupancy"
            valueLabel="Occupancy"
            valueFormatter={(value) => `${value}%`}
            yDomain={[0, 100]}
          />
        </ChartCard>
      </div>
      <div className="col-span-12 xl:col-span-6">
        <ChartCard
          title="Staff workload"
          description="Shift load index by department in the current synthetic scenario."
        >
          <HeatmapGrid
            data={demoBranchDashboard.staffWorkload}
            title="Staff workload heatmap"
          />
        </ChartCard>
      </div>
    </div>
  </HmsDashboardShell>
);

export default BranchAdminDashboard;
