import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../lib/api";
import { PageHeader } from "../../components/ui/page-header";
import {
  Shield,
  Layers,
  RefreshCcw,
  Building,
  ShieldAlert
} from "lucide-react";

interface HmoPartner {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface ClaimsReconciliation {
  id: string;
  claimIdentifier: string;
  loaReference: string;
  patientName: string;
  invoiceId: string;
  totalClaimValue: number;
  approvedValue: number;
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "DENIED" | "PAID";
  remarks?: string;
}

type ClaimStatus = ClaimsReconciliation["status"];

interface BackendHmoPartner {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface BackendClaim {
  id: string;
  claimNumber: string;
  loaNumber: string | null;
  amountClaimed: string | number;
  amountApproved: string | number | null;
  status: string;
  remarks: string | null;
  invoice: {
    id: string;
    order?: {
      patient?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
}

const toNumber = (value: string | number | null | undefined): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapPartner = (p: BackendHmoPartner): HmoPartner => ({
  id: p.id,
  name: p.name,
  code: p.code,
  status: p.status,
});

const buildPatientName = (claim: BackendClaim): string => {
  const patient = claim.invoice?.order?.patient;
  if (!patient) return "—";
  const first = patient.firstName ?? "";
  const last = patient.lastName ?? "";
  const combined = `${first} ${last}`.trim();
  return combined.length > 0 ? combined : "—";
};

const mapClaim = (c: BackendClaim): ClaimsReconciliation => ({
  id: c.id,
  claimIdentifier: c.claimNumber,
  loaReference: c.loaNumber ?? "",
  patientName: buildPatientName(c),
  invoiceId: c.invoice?.id ?? "",
  totalClaimValue: toNumber(c.amountClaimed),
  approvedValue: toNumber(c.amountApproved),
  status: c.status as ClaimStatus,
  remarks: c.remarks ?? "",
});

export const ClaimsDashboard = () => {
  const [partners, setPartners] = useState<HmoPartner[]>([]);
  const [claims, setClaims] = useState<ClaimsReconciliation[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimsReconciliation | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"pipeline" | "partners">("pipeline");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchClaimsData = useCallback(async () => {
    try {
      const [partnersRes, claimsRes] = await Promise.all([
        apiClient.get("/v1/claims/partners"),
        apiClient.get("/v1/claims")
      ]);
      const partnerData: BackendHmoPartner[] = Array.isArray(partnersRes.data) ? partnersRes.data : [];
      const claimData: BackendClaim[] = Array.isArray(claimsRes.data) ? claimsRes.data : [];
      setPartners(partnerData.map(mapPartner));
      setClaims(claimData.map(mapClaim));
      setFetchError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFetchError(error.response?.data?.message || "Failed to fetch claims data.");
    }
  }, []);

  useEffect(() => {
    void fetchClaimsData();
  }, [fetchClaimsData]);

  const handleOpenReconcile = (claim: ClaimsReconciliation) => {
    setSelectedClaim(claim);
    setApprovedAmount(claim.approvedValue || claim.totalClaimValue);
    setRemarks(claim.remarks || "");
    setUpdateError(null);
  };

  const patchClaimStatus = async (
    claimId: string,
    payload: { status: ClaimStatus; amountApproved?: number; remarks?: string },
  ) => {
    return apiClient.patch(`/v1/claims/${claimId}/status`, payload);
  };

  const handleSaveReconciliation = async () => {
    if (!selectedClaim) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const desiredApproved = approvedAmount > 0;
      const currentStatus = selectedClaim.status;

      if (currentStatus === "PENDING") {
        if (desiredApproved) {
          await patchClaimStatus(selectedClaim.id, { status: "SUBMITTED" });
          await patchClaimStatus(selectedClaim.id, {
            status: "APPROVED",
            amountApproved: approvedAmount,
            remarks,
          });
        } else {
          await patchClaimStatus(selectedClaim.id, { status: "DENIED", remarks });
        }
      } else if (currentStatus === "SUBMITTED") {
        if (desiredApproved) {
          await patchClaimStatus(selectedClaim.id, {
            status: "APPROVED",
            amountApproved: approvedAmount,
            remarks,
          });
        } else {
          await patchClaimStatus(selectedClaim.id, { status: "DENIED", remarks });
        }
      } else {
        await patchClaimStatus(selectedClaim.id, {
          status: desiredApproved ? "APPROVED" : "DENIED",
          amountApproved: desiredApproved ? approvedAmount : undefined,
          remarks,
        });
      }

      const updated = claims.map(c =>
        c.id === selectedClaim.id
          ? {
              ...c,
              approvedValue: approvedAmount,
              remarks,
              status: (desiredApproved ? "APPROVED" : "DENIED") as ClaimStatus,
            }
          : c
      );
      setClaims(updated);
      setIsUpdating(false);
      setSelectedClaim(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setUpdateError(error.response?.data?.message || "Failed to update claim status.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader
          title="HMO & PhilHealth Claims Center"
          description="Track insurance partner statuses, process authorization documents, and reconcile hospital invoices."
        />
        <button onClick={fetchClaimsData} className="btn btn-secondary flex items-center gap-1.5 text-xs py-2">
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "pipeline"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" /> Claims Reconciliation Pipeline
          </span>
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "partners"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" /> HMO Insurance Partners
          </span>
        </button>
      </div>

      {/* Global Notice — honest description of live backend contract */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-start gap-3 text-xs font-medium">
        <ShieldAlert className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <span className="font-bold">Live backend contract:</span>{' '}
            partners and claims are loaded from{' '}
            <code className="px-1 py-0.5 bg-emerald-100 rounded text-[11px]">/v1/claims/partners</code>{' '}
            and{' '}
            <code className="px-1 py-0.5 bg-emerald-100 rounded text-[11px]">/v1/claims</code>.
            Reconciliation writes go through the backend status machine via{' '}
            <code className="px-1 py-0.5 bg-emerald-100 rounded text-[11px]">PATCH /v1/claims/:id/status</code>
            {' '}(<code className="px-1 py-0.5 bg-emerald-100 rounded text-[11px]">PENDING → SUBMITTED → APPROVED → PAID</code>,
            {' '}<code className="px-1 py-0.5 bg-emerald-100 rounded text-[11px]">DENIED</code> as terminal).
            Server-authoritative: tenant and branch context are derived from the JWT, never trusted from the client.
          </p>
        </div>
      </div>

      {/* Error Notice */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium mt-4">
          <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* TAB 1: Claims Reconciliation Pipeline */}
      {activeTab === "pipeline" && (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase">Claim ID</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase">LOA Reference</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase">Patient Name</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase font-mono">Invoice ID Link</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase text-right">Total Claim</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase text-right">Approved Amount</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map(claim => {
                let statusColor = "";

                if (claim.status === "PENDING") {
                  statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                } else if (claim.status === "SUBMITTED") {
                  statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                } else if (claim.status === "APPROVED") {
                  statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                } else if (claim.status === "PAID") {
                  statusColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                } else if (claim.status === "DENIED") {
                  statusColor = "bg-rose-50 text-rose-700 border-rose-200";
                }

                return (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">{claim.claimIdentifier}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{claim.loaReference || "—"}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{claim.patientName}</td>
                    <td className="px-5 py-4 text-indigo-600 font-bold font-mono">{claim.invoiceId}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">₱{claim.totalClaimValue.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-extrabold text-emerald-600">
                      ₱{claim.approvedValue.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 font-bold rounded-full border text-[9px] ${statusColor}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {claim.status !== "APPROVED" && claim.status !== "DENIED" && claim.status !== "PAID" ? (
                        <button
                          onClick={() => handleOpenReconcile(claim)}
                          className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5"
                        >
                          Reconcile
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold italic">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: HMO Insurance Partners Directory */}
      {activeTab === "partners" && (
        <div className="card overflow-hidden max-w-4xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase">Insurance Partner Name</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase">Unique ID Code</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-indigo-500" />
                    {p.name}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-600">{p.code}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg border font-bold text-[10px] ${
                      p.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CLAIMS RECONCILIATION DIALOG MODAL */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Claims reconciliation update">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
              <RefreshCcw className="h-5 w-5 text-indigo-600" />
              Claims Reconciliation Update
            </h3>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                <p><strong>Claim Identifier:</strong> {selectedClaim.claimIdentifier}</p>
                <p><strong>LOA Reference:</strong> {selectedClaim.loaReference || "—"}</p>
                <p><strong>Patient Name:</strong> {selectedClaim.patientName}</p>
                <p><strong>Current Status:</strong> {selectedClaim.status}</p>
                <p><strong>Total Invoice Claim:</strong> ₱{selectedClaim.totalClaimValue.toLocaleString()}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Authorized Approved Value (₱)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={e => setApprovedAmount(Number(e.target.value))}
                  className="input"
                  disabled={isUpdating}
                  data-testid="approved-amount-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Insurance Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  className="input py-2"
                  placeholder="Notes from insurance partner..."
                  disabled={isUpdating}
                  data-testid="remarks-input"
                />
              </div>

              {updateError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs" role="alert" data-testid="update-error">
                  {updateError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={isUpdating}
                onClick={() => { setSelectedClaim(null); setUpdateError(null); }}
                className="btn btn-secondary text-xs px-4 py-2"
                data-testid="cancel-reconcile"
              >
                Cancel
              </button>
              <button
                disabled={isUpdating}
                onClick={handleSaveReconciliation}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 disabled:bg-indigo-300"
                data-testid="save-reconciliation"
              >
                {isUpdating ? "Saving…" : "Save Reconciliation"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
