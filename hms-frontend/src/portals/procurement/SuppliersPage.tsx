import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import {
  procurementService,
  type Supplier,
  type CreateSupplierPayload,
} from '../../services/procurement.service';

const initialCreateForm: CreateSupplierPayload = {
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
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

const statusBadgeClass = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'ACCREDITED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'INACTIVE' || s === 'SUSPENDED' || s === 'PROBATION') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const formatCreatedAt = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] =
    useState<CreateSupplierPayload>(initialCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await procurementService.listSuppliers();
      setSuppliers(list);
    } catch (err: unknown) {
      setFetchError(extractApiError(err, 'Failed to load supplier directory.'));
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const haystack = [
        s.name,
        s.contactName,
        s.contactEmail,
        s.contactPhone,
        s.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [suppliers, searchInput]);

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const validateForm = (form: CreateSupplierPayload): string | null => {
    if (!form.name.trim()) {
      return 'Supplier name is required.';
    }
    const email = form.contactEmail?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Contact email is not a valid email address.';
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
      const payload: CreateSupplierPayload = {
        name: createForm.name.trim(),
        ...(createForm.contactName?.trim()
          ? { contactName: createForm.contactName.trim() }
          : {}),
        ...(createForm.contactEmail?.trim()
          ? { contactEmail: createForm.contactEmail.trim() }
          : {}),
        ...(createForm.contactPhone?.trim()
          ? { contactPhone: createForm.contactPhone.trim() }
          : {}),
        ...(createForm.address?.trim()
          ? { address: createForm.address.trim() }
          : {}),
      };
      const created = await procurementService.createSupplier(payload);
      setCreateSuccess(`Supplier "${created.name}" added successfully.`);
      setCreateForm(initialCreateForm);
      await fetchSuppliers();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setCreateError(extractApiError(err, 'Failed to create supplier.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Supplier Directory"
        description="Manage accredited vendors, accreditation status, and vendor contact records"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchSuppliers()}
              disabled={loading}
              data-testid="suppliers-refresh"
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh suppliers"
            >
              <RefreshCw
                className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              data-testid="suppliers-create"
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
            >
              <Plus className="h-4 w-4" /> Add New Supplier
            </button>
          </div>
        }
      />

      <div className="card p-4 flex flex-wrap gap-4 items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            data-testid="suppliers-search"
            placeholder="Search suppliers by name or contact…"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          />
        </div>
        <div
          className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold"
          data-testid="suppliers-count"
        >
          {filteredSuppliers.length} of {suppliers.length} supplier
          {suppliers.length === 1 ? '' : 's'}
        </div>
      </div>

      {fetchError && (
        <div
          role="alert"
          data-testid="suppliers-fetch-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {fetchError}
        </div>
      )}

      {loading ? (
        <div
          data-testid="suppliers-loading"
          className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs"
        >
          Loading supplier directory…
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div
          data-testid="suppliers-empty"
          className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs"
        >
          {suppliers.length === 0 ? (
            <>
              No suppliers yet. Use <strong>Add New Supplier</strong> to add one.
            </>
          ) : (
            <>No suppliers match your search.</>
          )}
        </div>
      ) : (
        <div
          data-testid="suppliers-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              data-testid={`supplier-card-${sup.id}`}
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${statusBadgeClass(sup.status)}`}
                  data-testid={`supplier-status-${sup.id}`}
                >
                  {sup.status}
                </div>
              </div>

              <div>
                <h4
                  className="text-sm font-black text-slate-800 tracking-tight"
                  data-testid={`supplier-name-${sup.id}`}
                >
                  {sup.name}
                </h4>
                {sup.contactName ? (
                  <p className="text-[10px] text-slate-400 font-medium">
                    {sup.contactName}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 pt-1">
                {sup.contactEmail ? (
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </span>
                    <span className="text-slate-700 font-bold truncate">
                      {sup.contactEmail}
                    </span>
                  </div>
                ) : null}
                {sup.contactPhone ? (
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </span>
                    <span className="text-slate-700 font-bold">
                      {sup.contactPhone}
                    </span>
                  </div>
                ) : null}
                {sup.address ? (
                  <div className="flex items-start justify-between text-[11px] gap-2">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                      <MapPin className="h-3.5 w-3.5" /> Address
                    </span>
                    <span className="text-slate-700 font-bold text-right max-w-[60%]">
                      {sup.address}
                    </span>
                  </div>
                ) : null}
                {formatCreatedAt(sup.createdAt) ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Added</span>
                    <span className="text-slate-700 font-bold">
                      {formatCreatedAt(sup.createdAt)}
                    </span>
                  </div>
                ) : null}
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
                  Add New Supplier
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                data-testid="suppliers-create-close"
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  data-testid="suppliers-create-success"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  data-testid="suppliers-create-error"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Supplier Name <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="suppliers-create-name"
                  placeholder="e.g. Apex Medical Corp"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Contact Name
                </span>
                <input
                  type="text"
                  value={createForm.contactName ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      contactName: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  data-testid="suppliers-create-contact-name"
                  placeholder="Primary point of contact"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">Email</span>
                  <input
                    type="email"
                    value={createForm.contactEmail ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        contactEmail: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="suppliers-create-email"
                    placeholder="orders@example.com"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-bold text-slate-700">Phone</span>
                  <input
                    type="tel"
                    value={createForm.contactPhone ?? ''}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        contactPhone: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="suppliers-create-phone"
                    placeholder="+1-555-0100"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">Address</span>
                <textarea
                  value={createForm.address ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, address: e.target.value }))
                  }
                  disabled={isSubmitting}
                  data-testid="suppliers-create-address"
                  rows={2}
                  placeholder="Street, city, country"
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
                data-testid="suppliers-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : 'Create Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SuppliersPage;
