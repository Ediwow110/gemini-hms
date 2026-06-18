import React, { useEffect, useState, useCallback, useMemo } from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { DollarSign, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { ReportExportButton } from '../../components/analytics';
import {
  hrService,
  type HrPayslip,
  type HrPayslipEmployee,
} from '../../services/hr.service';

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const detail = e?.response?.data?.message;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) return detail.join(', ');
  if (e?.message) return e.message;
  return fallback;
};

const shortId = (id: string | null | undefined, fallback = '—'): string => {
  if (!id) return fallback;
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const toNumber = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPeriod = (
  periodStart: string | undefined,
  periodEnd: string | undefined,
): string => {
  const s = formatDate(periodStart);
  const e = formatDate(periodEnd);
  if (s && e) return `${s} — ${e}`;
  if (e) return e;
  if (s) return s;
  return '—';
};

const statusBadgeClass = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (s === 'DRAFT') {
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }
  return 'bg-slate-50 text-slate-500 border-slate-200';
};

const statusLabel = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return 'Paid';
  if (s === 'DRAFT') return 'Draft';
  return s || '—';
};

const deriveEmployeeName = (
  employee: HrPayslipEmployee | null | undefined,
  employeeId: string,
): string => {
  if (!employee) return `Employee ${shortId(employeeId, '—')}`;
  const first = (employee.firstName || '').trim();
  const last = (employee.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return `Employee ${employee.employeeNumber || shortId(employee.id, '—')}`;
};

const formatCurrency = (n: number): string =>
  n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 });

export const PayrollPage: React.FC = () => {
  const [payslips, setPayslips] = useState<HrPayslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await hrService.listPayslips();
      setPayslips(list);
    } catch (err: unknown) {
      setFetchError(extractApiError(err, 'Failed to load payroll records.'));
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayslips();
  }, [fetchPayslips]);

  const stats = useMemo(() => {
    let paid = 0;
    let draft = 0;
    for (const p of payslips) {
      if ((p.status || '').toUpperCase() === 'PAID') paid += 1;
      else draft += 1;
    }
    return { paid, draft, total: payslips.length };
  }, [payslips]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2
            className="text-xl font-black text-slate-800 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Payroll Console
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage salary disbursements, deductions, and tax compliance
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <button
            type="button"
            onClick={() => void fetchPayslips()}
            disabled={loading}
            data-testid="payroll-refresh"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh payroll records"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <ReportExportButton label="Export tax records" sensitive requiresReason />
          <button
            type="button"
            disabled
            title="Backend POST /api/v1/hr/payroll/generate exists, but the payslip creation form/UI is not yet implemented on this page. Action remains unavailable from this UI."
            className="btn cursor-not-allowed bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200"
          >
            <FileText className="h-4 w-4" /> Generate Pay Slips WIP
          </button>
        </div>
      </div>

      <HRScopeFilter />

      {fetchError && (
        <div
          role="alert"
          data-testid="payroll-fetch-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {fetchError}
        </div>
      )}

      {payslips.length > 0 && !fetchError ? (
        <div
          data-testid="payroll-summary"
          className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total
            </p>
            <p
              className="text-lg font-black text-slate-900"
              data-testid="payroll-stat-total"
            >
              {stats.total}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Paid
            </p>
            <p
              className="text-lg font-black text-emerald-600"
              data-testid="payroll-stat-paid"
            >
              {stats.paid}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Draft
            </p>
            <p
              className="text-lg font-black text-slate-600"
              data-testid="payroll-stat-draft"
            >
              {stats.draft}
            </p>
          </div>
        </div>
      ) : null}

      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-black text-slate-800 tracking-tight uppercase">
            Payslip Records
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Employee</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Basic</th>
                <th className="pb-3">Allowances</th>
                <th className="pb-3">Deductions</th>
                <th className="pb-3">Net Pay</th>
                <th className="pb-3 text-right pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50" data-testid="payroll-list">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    data-testid="payroll-loading"
                    className="py-6 text-center text-slate-400"
                  >
                    Loading payroll records…
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    data-testid="payroll-empty"
                    className="py-6 text-center text-slate-400"
                  >
                    No payroll records found for this tenant yet.
                  </td>
                </tr>
              ) : (
                payslips.map((p) => (
                  <tr
                    key={p.id}
                    data-testid={`payroll-row-${p.id}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td
                      className="py-3 pl-2 font-bold text-slate-800"
                      data-testid={`payroll-employee-${p.id}`}
                    >
                      {deriveEmployeeName(p.employee, p.employeeId)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatPeriod(p.periodStart, p.periodEnd)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatCurrency(toNumber(p.basicSalary))}
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatCurrency(toNumber(p.totalAllowances))}
                    </td>
                    <td className="py-3 text-rose-500">
                      {formatCurrency(toNumber(p.totalDeductions))}
                    </td>
                    <td
                      className="py-3 font-black text-slate-900"
                      data-testid={`payroll-net-${p.id}`}
                    >
                      {formatCurrency(toNumber(p.netSalary))}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadgeClass(p.status)}`}
                        data-testid={`payroll-status-${p.id}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
