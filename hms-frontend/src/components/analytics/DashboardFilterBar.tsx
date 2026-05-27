import type { ReactNode } from 'react';
import type { DateRange } from '../../types/analytics';

interface Option {
  label: string;
  value: string;
}

interface DashboardFilterBarProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  branch?: string;
  onBranchChange?: (value: string) => void;
  department?: string;
  onDepartmentChange?: (value: string) => void;
  tenant?: string;
  onTenantChange?: (value: string) => void;
  reportType?: string;
  onReportTypeChange?: (value: string) => void;
  branchOptions?: Option[];
  departmentOptions?: Option[];
  tenantOptions?: Option[];
  reportTypeOptions?: Option[];
  extraFilters?: ReactNode;
}

const defaultBranches = [
  { label: 'All branches', value: 'all' },
  { label: 'Metro Manila', value: 'metro' },
  { label: 'North Campus', value: 'north' },
];

const defaultDepartments = [
  { label: 'All departments', value: 'all' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Laboratory', value: 'laboratory' },
  { label: 'Billing', value: 'billing' },
];

const Select = ({ id, label, value, onChange, options }: { id: string; label: string; value?: string; onChange?: (value: string) => void; options: Option[] }) => (
  <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
    {label}
    <select
      id={id}
      value={value ?? options[0]?.value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      disabled={!onChange}
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

export const DashboardFilterBar = ({
  dateRange,
  onDateRangeChange,
  branch,
  onBranchChange,
  department,
  onDepartmentChange,
  tenant,
  onTenantChange,
  reportType,
  onReportTypeChange,
  branchOptions = defaultBranches,
  departmentOptions = defaultDepartments,
  tenantOptions = [{ label: 'All tenants', value: 'all' }],
  reportTypeOptions = [{ label: 'All report types', value: 'all' }],
  extraFilters,
}: DashboardFilterBarProps) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm" role="search" aria-label="Dashboard filters">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        From
        <input
          type="date"
          value={dateRange.from}
          onChange={(event) => onDateRangeChange({ ...dateRange, from: event.target.value })}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        To
        <input
          type="date"
          value={dateRange.to}
          onChange={(event) => onDateRangeChange({ ...dateRange, to: event.target.value })}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      {onTenantChange && <Select id="tenant-filter" label="Tenant" value={tenant} onChange={onTenantChange} options={tenantOptions} />}
      {onBranchChange && <Select id="branch-filter" label="Branch" value={branch} onChange={onBranchChange} options={branchOptions} />}
      {onDepartmentChange && <Select id="department-filter" label="Department" value={department} onChange={onDepartmentChange} options={departmentOptions} />}
      {onReportTypeChange && <Select id="report-type-filter" label="Report type" value={reportType} onChange={onReportTypeChange} options={reportTypeOptions} />}
      {extraFilters}
    </div>
  </div>
);

export default DashboardFilterBar;
