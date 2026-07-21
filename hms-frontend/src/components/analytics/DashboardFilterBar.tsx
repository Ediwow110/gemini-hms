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
  disabled?: boolean;
  disabledReason?: string;
}

const defaultBranches = [{ label: 'All branches', value: 'all' }];
const defaultDepartments = [{ label: 'All departments', value: 'all' }];

const fieldClassName =
  'min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

const Select = ({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Option[];
  disabled?: boolean;
}) => (
  <label className="min-w-[150px] flex-1 text-[11px] font-semibold text-slate-500">
    <span className="mb-1 block">{label}</span>
    <select
      id={id}
      value={value ?? options[0]?.value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      className={fieldClassName}
      disabled={disabled || !onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
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
  disabled = false,
  disabledReason,
}: DashboardFilterBarProps) => (
  <div
    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    role="search"
    aria-label="Dashboard filters"
  >
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-[145px] flex-1 text-[11px] font-semibold text-slate-500">
        <span className="mb-1 block">From</span>
        <input
          type="date"
          value={dateRange.from}
          onChange={(event) =>
            onDateRangeChange({ ...dateRange, from: event.target.value })
          }
          className={fieldClassName}
          disabled={disabled}
        />
      </label>
      <label className="min-w-[145px] flex-1 text-[11px] font-semibold text-slate-500">
        <span className="mb-1 block">To</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(event) =>
            onDateRangeChange({ ...dateRange, to: event.target.value })
          }
          className={fieldClassName}
          disabled={disabled}
        />
      </label>
      {onTenantChange && (
        <Select
          id="tenant-filter"
          label="Tenant"
          value={tenant}
          onChange={onTenantChange}
          options={tenantOptions}
          disabled={disabled}
        />
      )}
      {onBranchChange && (
        <Select
          id="branch-filter"
          label="Branch"
          value={branch}
          onChange={onBranchChange}
          options={branchOptions}
          disabled={disabled}
        />
      )}
      {onDepartmentChange && (
        <Select
          id="department-filter"
          label="Department"
          value={department}
          onChange={onDepartmentChange}
          options={departmentOptions}
          disabled={disabled}
        />
      )}
      {onReportTypeChange && (
        <Select
          id="report-type-filter"
          label="Report type"
          value={reportType}
          onChange={onReportTypeChange}
          options={reportTypeOptions}
          disabled={disabled}
        />
      )}
      {extraFilters}
    </div>
    {disabled && disabledReason && (
      <p className="mt-2 text-xs text-amber-700">{disabledReason}</p>
    )}
  </div>
);

export default DashboardFilterBar;
