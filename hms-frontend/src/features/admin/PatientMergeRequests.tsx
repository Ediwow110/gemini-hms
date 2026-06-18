import { useState, useEffect } from "react";
import { apiClient } from "../../lib/api";
import { PageHeader } from "../../components/ui/page-header";
import {
  GitMerge,
  User,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

interface MergeRequest {
  id: string;
  sourcePatientId: string;
  targetPatientId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requesterId: string;
  reason: string;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  sourcePatient: {
    patientNumber: string;
    firstName: string;
    lastName: string;
    dob: string;
  };
  targetPatient: {
    patientNumber: string;
    firstName: string;
    lastName: string;
    dob: string;
  };
}

type ActionKind = "APPROVE" | "REJECT" | null;

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

export const PatientMergeRequests = () => {
  const [requests, setRequests] = useState<MergeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MergeRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [modalAction, setModalAction] = useState<ActionKind>(null);
  const [modalText, setModalText] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchMergeRequests = async () => {
    try {
      const res = await apiClient.get("/v1/patients/merge-requests");
      const list = (res.data?.data ?? []) as MergeRequest[];
      setRequests(list);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, "Failed to fetch merge requests."));
      setRequests([]);
    }
  };

  useEffect(() => {
    void fetchMergeRequests();
  }, []);

  const openActionModal = (action: ActionKind) => {
    if (!selectedRequest) return;
    setActionError(null);
    setActionSuccess(null);
    setModalError(null);
    setModalText("");
    setModalAction(action);
  };

  const closeActionModal = () => {
    if (isProcessing) return;
    setModalAction(null);
    setModalText("");
    setModalError(null);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    setModalError(null);
    try {
      await apiClient.post(
        `/v1/patients/merge-requests/${selectedRequest.id}/approve`,
        { remarks: modalText.trim() || undefined }
      );
      setActionSuccess(`Merge request ${selectedRequest.id} approved.`);
      setRequests((rs) => rs.filter((r) => r.id !== selectedRequest.id));
      setSelectedRequest(null);
      setModalAction(null);
      setModalText("");
    } catch (err: unknown) {
      setActionError(extractErrorMessage(err, "Failed to approve merge request."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const reason = modalText.trim();
    if (!reason) {
      setModalError("Reason is required to reject a merge request.");
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    setModalError(null);
    try {
      await apiClient.post(
        `/v1/patients/merge-requests/${selectedRequest.id}/reject`,
        { reason }
      );
      setActionSuccess(`Merge request ${selectedRequest.id} rejected.`);
      setRequests((rs) => rs.filter((r) => r.id !== selectedRequest.id));
      setSelectedRequest(null);
      setModalAction(null);
      setModalText("");
    } catch (err: unknown) {
      setActionError(extractErrorMessage(err, "Failed to reject merge request."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (modalAction === "APPROVE") void handleApprove();
    else if (modalAction === "REJECT") void handleReject();
  };

  const isPending = selectedRequest?.status !== "PENDING";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Patient Identity Reconciliation Center"
          description="High-security administrative deduplication dashboard to resolve duplicate patient charts."
        />
        <button
          onClick={fetchMergeRequests}
          className="btn btn-secondary flex items-center gap-1.5 text-xs py-2"
          data-testid="reload-merge-requests"
        >
          <RotateCw className="h-3.5 w-3.5" /> Reload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Honest capability notice */}
        <div className="lg:col-span-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>
            Approve and reject are live against the patient-merge-request backend.
            Irreversible cascade merge execution is not yet implemented in this release — the controller only
            flips a request to APPROVED. The actual chart merge is performed by a separate (not-yet-shipped) job.
          </span>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div
            className="lg:col-span-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium"
            role="alert"
            data-testid="fetch-error"
          >
            <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Action feedback */}
        {actionSuccess && (
          <div
            className="lg:col-span-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium"
            role="status"
            data-testid="action-success"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div
            className="lg:col-span-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium"
            role="alert"
            data-testid="action-error"
          >
            <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Left Pane: Pending Queue */}
        <div className="card p-5 space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2 border-b pb-3 border-slate-100">
            <GitMerge className="h-4.5 w-4.5 text-indigo-500" />
            Pending Merge Queue
          </h3>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {requests.length > 0 ? (
              requests.map((req) => {
                const active = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    data-testid={`merge-request-${req.id}`}
                    className={`p-4 rounded-2xl border transition-all duration-250 cursor-pointer ${
                      active
                        ? "border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 shadow-sm"
                        : "border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          Merge: {req.sourcePatient.firstName} &rarr; {req.targetPatient.firstName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Ticket: {req.id}</p>
                      </div>
                      <span
                        className={`font-extrabold text-[9px] px-2 py-0.5 rounded ${
                          req.status === "PENDING"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
                      <span>By: {req.requesterId}</span>
                      <span>{req.createdAt}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p
                className="text-center text-xs text-slate-400 py-8 font-medium"
                data-testid="empty-queue"
              >
                No pending deduplication requests found.
              </p>
            )}
          </div>
        </div>

        {/* Right Pane: Structural Compare Box */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between min-h-[500px]">
          {selectedRequest ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2 border-b pb-3 border-slate-100">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                  Structural Chart Comparison
                </h3>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  {/* SOURCE PROFILE CARD */}
                  <div className="border border-amber-200 bg-amber-50/10 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2.5">
                      <Trash2 className="h-4 w-4 text-amber-600" />
                      <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wide">
                        Source Chart (To Deprecate)
                      </h4>
                    </div>

                    <div className="text-xs space-y-2 text-slate-600">
                      <p><strong>First Name:</strong> {selectedRequest.sourcePatient.firstName}</p>
                      <p><strong>Last Name:</strong> {selectedRequest.sourcePatient.lastName}</p>
                      <p><strong>Date of Birth:</strong> {selectedRequest.sourcePatient.dob}</p>
                      <p><strong>Patient Number:</strong> {selectedRequest.sourcePatient.patientNumber}</p>
                      <p className="text-[10px] text-slate-400">UUID: {selectedRequest.sourcePatientId}</p>
                    </div>
                  </div>

                  {/* DESTINATION PROFILE CARD */}
                  <div className="border border-indigo-200 bg-indigo-50/10 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-indigo-200/50 pb-2.5">
                      <User className="h-4 w-4 text-indigo-600" />
                      <h4 className="font-bold text-indigo-800 text-xs uppercase tracking-wide">
                        Target Chart (To Retain)
                      </h4>
                    </div>

                    <div className="text-xs space-y-2 text-slate-600">
                      <p><strong>First Name:</strong> {selectedRequest.targetPatient.firstName}</p>
                      <p><strong>Last Name:</strong> {selectedRequest.targetPatient.lastName}</p>
                      <p><strong>Date of Birth:</strong> {selectedRequest.targetPatient.dob}</p>
                      <p><strong>Patient Number:</strong> {selectedRequest.targetPatient.patientNumber}</p>
                      <p className="text-[10px] text-slate-400">UUID: {selectedRequest.targetPatientId}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Request reason:
                  </span>
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-6">
                <button
                  onClick={() => openActionModal("REJECT")}
                  disabled={isProcessing || isPending}
                  data-testid="reject-merge-button"
                  className="btn bg-rose-50 hover:bg-rose-100/60 text-rose-600 text-xs px-4 py-2 border border-rose-200 flex items-center gap-1.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Merge
                </button>

                <button
                  onClick={() => openActionModal("APPROVE")}
                  disabled={isProcessing || isPending}
                  data-testid="approve-merge-button"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Merge
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <HelpCircle className="h-16 w-16 text-slate-200 mb-3" />
              <p className="font-bold text-slate-500">No Request Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                Please highlight a deduplication ticket from the queue in the left pane to view compare records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controlled remarks modal (approve or reject) */}
      {modalAction && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          data-testid="action-modal"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-100">
              {modalAction === "APPROVE" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Approve merge request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-600" />
                  Reject merge request
                </>
              )}
            </h3>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {modalAction === "APPROVE"
                ? `Approving will set the request status to APPROVED. The irreversible cascade merge itself is not yet implemented in this release.`
                : `Rejecting will set the request status to REJECTED. A reason is required for the audit trail.`}
            </p>

            <div className="mt-4">
              <label
                htmlFor="action-text"
                className="block text-[10px] font-extrabold text-slate-700 uppercase"
              >
                {modalAction === "APPROVE" ? "Remarks (optional)" : "Reason (required)"}
              </label>
              <textarea
                id="action-text"
                value={modalText}
                onChange={(e) => {
                  setModalText(e.target.value);
                  if (modalError) setModalError(null);
                }}
                placeholder={
                  modalAction === "APPROVE"
                    ? "Add remarks (optional)…"
                    : "Add a reason for rejection…"
                }
                rows={3}
                data-testid="action-text"
                className="input mt-1.5 focus:border-indigo-300 w-full"
              />
              {modalError && (
                <p
                  className="text-[10px] text-rose-600 mt-1 font-semibold"
                  data-testid="modal-error"
                  role="alert"
                >
                  {modalError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={isProcessing}
                onClick={closeActionModal}
                data-testid="cancel-action"
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={
                  isProcessing ||
                  (modalAction === "REJECT" && modalText.trim().length === 0)
                }
                onClick={handleConfirm}
                data-testid={
                  modalAction === "APPROVE" ? "confirm-approve" : "confirm-reject"
                }
                className={`btn text-xs px-4 py-2 ${
                  modalAction === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing
                  ? "Processing…"
                  : modalAction === "APPROVE"
                  ? "Confirm Approve"
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
