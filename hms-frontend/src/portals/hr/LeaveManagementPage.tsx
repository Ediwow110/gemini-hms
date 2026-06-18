import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, Plus, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { LeaveQueuePanel, type LeaveRequest } from './components/LeaveQueuePanel';
import {
  hrService,
  type HrLeaveRequest,
  type HrEmployee,
  type CreateLeaveRequestPayload,
  type LeaveRequestType,
} from '../../services/hr.service';

const LEAVE_TYPE_OPTIONS: { value: LeaveRequestType; label: string }[] = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

const initialForm: CreateLeaveRequestPayload = {
  employeeId: '',
  type: 'ANNUAL',
  startDate: '',
  endDate: '',
  reason: '',
};

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

const computeEmployeeName = (req: HrLeaveRequest): string => {
  const e = req.employee;
  if (!e) {
    const fallbackId =
      req.employeeId && req.employeeId.length >= 6
        ? req.employeeId.slice(0, 6)
        : req.employeeId || 'unknown';
    return `Employee ${fallbackId}`;
  }
  const first = (e.firstName || '').trim();
  const last = (e.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return `Employee ${e.employeeNumber || e.id.slice(0, 6)}`;
};

const computeDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  const ms = end - start;
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
};

const mapLeaveRequest = (req: HrLeaveRequest): LeaveRequest => ({
  id: req.id,
  employeeName: computeEmployeeName(req),
  type: req.type,
  startDate: req.startDate,
  endDate: req.endDate,
  days: computeDays(req.startDate, req.endDate),
  status: req.status,
});

export const LeaveManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<HrLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [createForm, setCreateForm] =
    useState<CreateLeaveRequestPayload>(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await hrService.listLeaveRequests();
      setRequests(list);
    } catch (err: unknown) {
      setFetchError(
        extractApiError(err, 'Failed to load leave requests.'),
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const list = await hrService.listEmployees();
      setEmployees(list);
    } catch (err: unknown) {
      setEmployeesError(
        extractApiError(err, 'Failed to load employee list.'),
      );
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm(initialForm);
    setCreateError(null);
    setCreateSuccess(null);
    if (employees.length === 0 && !employeesLoading) {
      void fetchEmployees();
    }
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setCreateForm(initialForm);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const validateForm = (form: CreateLeaveRequestPayload): string | null => {
    if (!form.employeeId.trim()) {
      return 'Employee is required.';
    }
    if (!form.type.trim()) {
      return 'Leave type is required.';
    }
    if (!form.startDate.trim()) {
      return 'Start date is required.';
    }
    if (!form.endDate.trim()) {
      return 'End date is required.';
    }
    if (
      new Date(form.endDate).getTime() < new Date(form.startDate).getTime()
    ) {
      return 'End date must be on or after start date.';
    }
    if (!form.reason.trim()) {
      return 'Reason is required.';
    }
    return null;
  };

  const handleCreate = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    const validationError = validateForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLeaveRequestPayload = {
        employeeId: createForm.employeeId.trim(),
        type: createForm.type.trim(),
        startDate: createForm.startDate.trim(),
        endDate: createForm.endDate.trim(),
        reason: createForm.reason.trim(),
      };
      const created = await hrService.createLeaveRequest(payload);
      setCreateSuccess(
        `Leave request for ${computeEmployeeName(created)} created.`,
      );
      setCreateForm(initialForm);
      await fetchLeaveRequests();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setCreateError(extractApiError(err, 'Failed to create leave request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (req: LeaveRequest) => {
    setBusyRequestId(req.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await hrService.approveLeaveRequest(req.id);
      setActionSuccess(`Approved leave request for ${req.employeeName}.`);
      await fetchLeaveRequests();
    } catch (err: unknown) {
      setActionError(extractApiError(err, 'Failed to approve leave request.'));
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleReject = async (req: LeaveRequest) => {
    setBusyRequestId(req.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await hrService.rejectLeaveRequest(req.id);
      setActionSuccess(`Rejected leave request for ${req.employeeName}.`);
      await fetchLeaveRequests();
    } catch (err: unknown) {
      setActionError(extractApiError(err, 'Failed to reject leave request.'));
    } finally {
      setBusyRequestId(null);
    }
  };

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').map(mapLeaveRequest),
    [requests],
  );
  const allRequestsMapped = useMemo(
    () => requests.map(mapLeaveRequest),
    [requests],
  );
  const pendingCount = pendingRequests.length;
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED').length,
    [requests],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2
            className="text-xl font-black text-slate-800 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Leave Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Review and approve employee time-off requests
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <button
            type="button"
            onClick={() => void fetchLeaveRequests()}
            disabled={loading}
            data-testid="leave-refresh"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh leave requests"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            data-testid="leave-create"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
          >
            <Plus className="h-4 w-4" /> Request Leave for Staff
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          role="status"
          data-testid="leave-action-success"
          className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          data-testid="leave-action-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {actionError}
        </div>
      )}

      {fetchError && (
        <div
          role="alert"
          data-testid="leave-fetch-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div
              data-testid="leave-loading"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs"
            >
              Loading leave requests…
            </div>
          ) : pendingRequests.length === 0 ? (
            <div
              data-testid="leave-empty"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs"
            >
              No pending leave requests. Use <strong>Request Leave for Staff</strong> to add one.
            </div>
          ) : (
            <LeaveQueuePanel
              requests={pendingRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              busyRequestId={busyRequestId}
            />
          )}

          {allRequestsMapped.length > pendingCount ? (
            <div
              data-testid="leave-recent"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Decisions
              </h3>
              <div className="space-y-2">
                {allRequestsMapped
                  .filter((r) => r.status !== 'PENDING')
                  .slice(0, 5)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-slate-700">
                          {req.employeeName}
                        </p>
                        <p className="text-slate-400">
                          {req.startDate} — {req.endDate} ({req.days} days)
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                        data-testid={`leave-status-${req.id}`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Leave Calendar Overview
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <Calendar className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-[10px] text-slate-400 font-medium">Monthly leave calendar shell</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Currently Out</span>
                <span className="text-indigo-600" data-testid="leave-stat-currently-out">
                  {approvedCount} Personnel
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Pending</span>
                <span className="text-indigo-600" data-testid="leave-stat-pending">
                  {pendingCount} Personnel
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Policy Shell</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Standard annual leave is 15 days/year. Sick leave is 7 days/year. Emergency leave requires supervisor notification within 2 hours of shift start.
            </p>
            <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
              View Leave Policies &rarr;
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Request Leave for Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                data-testid="leave-create-close"
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  data-testid="leave-create-success"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  data-testid="leave-create-error"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Employee <span className="text-rose-500">*</span>
                </span>
                {employeesLoading ? (
                  <p
                    data-testid="leave-create-employee-loading"
                    className="mt-1 text-[10px] text-slate-400"
                  >
                    Loading employees…
                  </p>
                ) : employeesError ? (
                  <p
                    role="alert"
                    data-testid="leave-create-employee-error"
                    className="mt-1 text-[10px] text-rose-600"
                  >
                    {employeesError}
                  </p>
                ) : (
                  <select
                    value={createForm.employeeId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        employeeId: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="leave-create-employee"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select an employee</option>
                    {employees.map((emp) => {
                      const label = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee ${emp.employeeNumber}`;
                      return (
                        <option key={emp.id} value={emp.id}>
                          {label} ({emp.employeeNumber})
                        </option>
                      );
                    })}
                  </select>
                )}
              </label>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Leave Type <span className="text-rose-500">*</span>
                </span>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, type: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="leave-create-type"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {LEAVE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">
                    Start Date <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="leave-create-start"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">
                    End Date <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="leave-create-end"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Reason <span className="text-rose-500">*</span>
                </span>
                <textarea
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="leave-create-reason"
                  rows={3}
                  placeholder="Brief context for the request"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isSubmitting}
                data-testid="leave-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPage;
