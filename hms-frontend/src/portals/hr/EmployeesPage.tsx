import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EmployeeWorklist, Employee } from './components/EmployeeWorklist';
import {
  hrService,
  type HrEmployee,
  type HrEmployeeStatus,
  type CreateEmployeePayload,
} from '../../services/hr.service';
import { adminService } from '../../services/admin.service';
import { useUser } from '../../hooks/use-user';
import {
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

const initialCreateForm: CreateEmployeePayload = {
  branchId: '',
  department: '',
  position: '',
  hireDate: new Date().toISOString().slice(0, 10),
  firstName: '',
  lastName: '',
  salary: undefined,
};

const STATUS_UPDATE_ROLES = ['Super Admin', 'HR Manager', 'HR Staff'] as const;

const DESTRUCTIVE_STATUSES: HrEmployeeStatus[] = ['RESIGNED', 'TERMINATED'];

const mapHrEmployeeToDisplay = (e: HrEmployee): Employee => {
  const first = (e.firstName ?? '').trim();
  const last = (e.lastName ?? '').trim();
  const name = [first, last].filter(Boolean).join(' ') || e.employeeNumber || '(unnamed)';

  let displayStatus: Employee['status'];
  switch (e.status) {
    case 'ACTIVE':
      displayStatus = 'ACTIVE';
      break;
    case 'ON_LEAVE':
      displayStatus = 'ON_LEAVE';
      break;
    case 'TERMINATED':
      displayStatus = 'TERMINATED';
      break;
    case 'SUSPENDED':
    case 'RESIGNED':
    default:
      displayStatus = 'OFFBOARDED';
      break;
  }

  return {
    id: e.id,
    name,
    email: e.employeeNumber,
    role: e.position || e.department || '—',
    department: e.department || '—',
    branch: e.branchId,
    status: displayStatus,
    rawStatus: e.status,
    joinedAt: e.hireDate ? e.hireDate.slice(0, 10) : '',
  };
};

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

export const EmployeesPage: React.FC = () => {
  const user = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEmployeePayload>(initialCreateForm);
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const canChangeStatus = useMemo(
    () => !!user && user.roles.some((r) => STATUS_UPDATE_ROLES.includes(r as typeof STATUS_UPDATE_ROLES[number])),
    [user],
  );

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await hrService.listEmployees();
      setEmployees(list.map(mapHrEmployeeToDisplay));
    } catch (err: unknown) {
      setFetchError(extractApiError(err, 'Failed to load employee directory.'));
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await adminService.listBranches({ limit: 200 });
      setBranches(res.data.map((b) => ({ id: b.id, name: b.name, code: b.code })));
    } catch {
      setBranches([]);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
    void fetchBranches();
  }, [fetchEmployees, fetchBranches]);

  const handleCreate = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (
      !createForm.branchId ||
      !createForm.department.trim() ||
      !createForm.position.trim() ||
      !createForm.hireDate
    ) {
      setCreateError('Branch, department, position, and hire date are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateEmployeePayload = {
        branchId: createForm.branchId,
        department: createForm.department.trim(),
        position: createForm.position.trim(),
        hireDate: new Date(createForm.hireDate).toISOString(),
      };
      if (createForm.firstName?.trim()) payload.firstName = createForm.firstName.trim();
      if (createForm.lastName?.trim()) payload.lastName = createForm.lastName.trim();
      if (createForm.salary !== undefined && createForm.salary !== null) {
        payload.salary = Number(createForm.salary);
      }
      const created = await hrService.createEmployee(payload);
      setCreateSuccess(
        `Employee ${created.employeeNumber} registered successfully.`,
      );
      setCreateForm(initialCreateForm);
      await fetchEmployees();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setCreateError(extractApiError(err, 'Failed to register employee.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = useCallback(
    async (employeeId: string, newStatus: HrEmployeeStatus) => {
      if (DESTRUCTIVE_STATUSES.includes(newStatus)) {
        const confirmed = window.confirm(
          `Setting status to ${newStatus} will deactivate the linked user account, ` +
            'invalidate any active sessions, and update real staff records. ' +
            'This action will be audited. Continue?',
        );
        if (!confirmed) {
          return;
        }
      }
      setUpdateError(null);
      setUpdatingEmployeeId(employeeId);
      try {
        await hrService.updateEmployeeStatus(employeeId, newStatus);
        await fetchEmployees();
      } catch (err: unknown) {
        setUpdateError(extractApiError(err, 'Failed to update employee status.'));
      } finally {
        setUpdatingEmployeeId(null);
      }
    },
    [fetchEmployees],
  );

  const closeModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2
            className="text-xl font-black text-slate-800 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Employee Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage personnel records, roles, and employment status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchEmployees()}
            disabled={loading}
            data-testid="employees-refresh"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh employee directory"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            data-testid="employees-register"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Register Employee
          </button>
        </div>
      </div>

      {fetchError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {fetchError}
        </div>
      )}

      {updateError && (
        <div
          role="alert"
          data-testid="employees-status-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {updateError}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs">
          Loading employee directory…
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs">
          No employees match the current filters.
        </div>
      ) : (
        <EmployeeWorklist
          employees={employees}
          canChangeStatus={canChangeStatus}
          updatingEmployeeId={updatingEmployeeId}
          onStatusChange={handleStatusChange}
        />
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Register Employee
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
                data-testid="employees-create-close"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                  data-testid="employees-create-success"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                  data-testid="employees-create-error"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Branch <span className="text-rose-500">*</span>
                </span>
                <select
                  value={createForm.branchId}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, branchId: e.target.value }))
                  }
                  disabled={isSubmitting || branches.length === 0}
                  data-testid="employees-create-branch"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                {branches.length === 0 && (
                  <p className="mt-1 text-[10px] text-amber-700">
                    No branches available. Backend may be unavailable.
                  </p>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">First Name</span>
                  <input
                    type="text"
                    value={createForm.firstName ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    disabled={isSubmitting}
                    data-testid="employees-create-firstName"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">Last Name</span>
                  <input
                    type="text"
                    value={createForm.lastName ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    disabled={isSubmitting}
                    data-testid="employees-create-lastName"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Department <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={createForm.department}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, department: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="employees-create-department"
                  placeholder="e.g. Clinical Medicine"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Position <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={createForm.position}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, position: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="employees-create-position"
                  placeholder="e.g. Nurse"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">
                    Hire Date <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="date"
                    value={createForm.hireDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, hireDate: e.target.value }))
                    }
                    disabled={isSubmitting}
                    data-testid="employees-create-hireDate"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">Salary</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.salary ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        salary: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="employees-create-salary"
                    placeholder="optional"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isSubmitting}
                data-testid="employees-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Registering…' : 'Register Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
