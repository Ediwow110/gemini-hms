import React, { useEffect, useState, useCallback } from 'react';
import {
  Building,
  Users,
  Briefcase,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  hrService,
  type HrDepartment,
  type CreateDepartmentPayload,
} from '../../services/hr.service';

interface DepartmentCard {
  id: string;
  name: string;
  code: string;
  staffCount: number | null;
  branch: string;
  head: string;
}

const initialCreateForm: CreateDepartmentPayload = {
  name: '',
  code: '',
};

const mapDepartmentToCard = (d: HrDepartment): DepartmentCard => {
  const count = d._count?.employees;
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    staffCount: typeof count === 'number' ? count : null,
    branch: 'All branches',
    head: 'Not assigned',
  };
};

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDepartmentPayload>(initialCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await hrService.listDepartments();
      setDepartments(list.map(mapDepartmentToCard));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFetchError(
        error.response?.data?.message || 'Failed to load department directory.',
      );
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (!createForm.name.trim() || !createForm.code.trim()) {
      setCreateError('Department name and code are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateDepartmentPayload = {
        name: createForm.name.trim(),
        code: createForm.code.trim(),
      };
      const created = await hrService.createDepartment(payload);
      setCreateSuccess(`Department "${created.name}" (${created.code}) created successfully.`);
      setCreateForm(initialCreateForm);
      await fetchDepartments();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(
        error.response?.data?.message || 'Failed to create department.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Department Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Organizational structure and department leadership
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchDepartments()}
            disabled={loading}
            data-testid="departments-refresh"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh departments"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            data-testid="departments-create"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Department
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

      {loading ? (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs">
          Loading department directory…
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs">
          No departments found. Use <strong>Create Department</strong> to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">
                  CODE: {dept.code}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight">
                  {dept.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">{dept.branch}</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Department Head
                  </span>
                  <span className="text-slate-700 font-bold">{dept.head}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Total Staff
                  </span>
                  <span className="text-slate-700 font-bold">
                    {dept.staffCount !== null ? `${dept.staffCount} Personnel` : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">
                  Manage Department &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  Create Department
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
                data-testid="departments-create-close"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                  data-testid="departments-create-success"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                  data-testid="departments-create-error"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Department Name <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="departments-create-name"
                  placeholder="e.g. Clinical Medicine"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Department Code <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, code: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="departments-create-code"
                  placeholder="e.g. CLIN-MED"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Codes must be unique within the tenant.
                </p>
              </label>
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
                data-testid="departments-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
