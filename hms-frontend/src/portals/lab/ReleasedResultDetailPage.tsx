import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useReleasedLabResultDetail,
  usePatientClinicalSummary,
  useParameterDefinitions,
} from '../../hooks/use-clinical-workflow';
import { format, differenceInYears } from 'date-fns';
import {
  AlertTriangle,
  FlaskConical,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
  Printer,
  FileWarning,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsDashboardShell,
  HmsAuditFooter,
  HmsLoadingSkeleton,
  HmsDataUnavailable,
  HmsStatusChip,
} from '../../components/hms-dashboard';
import { RequirePermission } from '../../components/ui/RequirePermission';
import { labService } from '../../services/lab.service';

export const ReleasedResultDetailPage = () => {
  const { patientId, orderId } = useParams<{ patientId: string; orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: result, isLoading, error } = useReleasedLabResultDetail(patientId!, orderId!);
  const { data: patientSummary } = usePatientClinicalSummary(patientId!);
  const { data: parameterDefinitions } = useParameterDefinitions(orderId!);

  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendReason, setAmendReason] = useState('');
  const [submittingAmend, setSubmittingAmend] = useState(false);
  const [amendError, setAmendError] = useState<string | null>(null);

  const handleAmendRequest = async () => {
    if (!result?.id || !amendReason.trim()) return;
    setSubmittingAmend(true);
    setAmendError(null);
    try {
      await labService.requestAmendment(result.id, amendReason);
      setShowAmendModal(false);
      setAmendReason('');
      queryClient.invalidateQueries({
        queryKey: [
          'clinical-workflow',
          'released-lab-result-detail',
          patientId,
          orderId,
        ],
      });
    } catch {
      setAmendError('Failed to submit amendment request. Make sure the result is in RELEASED status.');
    } finally {
      setSubmittingAmend(false);
    }
  };

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsLoadingSkeleton rows={5} />
      </HmsDashboardShell>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    const isNotFound =
      axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsDataUnavailable
          sectionName={
            isForbidden
              ? 'Access Restricted'
              : isNotFound
              ? 'Result Not Found'
              : 'Connection Error'
          }
          expectedApi={
            isForbidden
              ? 'You do not have permission to view this released result.'
              : isNotFound
              ? 'This released lab result could not be found. It may have been archived or removed.'
              : 'Failed to load released result. Please try again.'
          }
        />
      </HmsDashboardShell>
    );
  }

  if (!result) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsDataUnavailable
          sectionName="No Result Found"
          expectedApi="This released lab result is not available."
        />
      </HmsDashboardShell>
    );
  }

  const resultsEntries = result.results
    ? Object.entries(result.results).map(([key, value]) => ({ key, value }))
    : [];

  return (
    <HmsDashboardShell
      toolbar={
        <div className="flex justify-between items-center w-full">
          <button
            onClick={() => navigate('/lab/released')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors no-print"
          >
            ← Back to Released Results
          </button>
          <div className="flex gap-2 no-print">
            <RequirePermission permission="lab.result.amend.request">
              <button
                onClick={() => setShowAmendModal(true)}
                className="btn btn-secondary border-rose-250 bg-rose-50/20 text-rose-700 hover:bg-rose-50 text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm border"
              >
                <FileWarning className="h-3.5 w-3.5" />
                Request Amendment
              </button>
            </RequirePermission>
            <button
              onClick={() => window.print()}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-indigo-200"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Result
            </button>
          </div>
        </div>
      }
      footer={<HmsAuditFooter dataSource="useReleasedLabResultDetail + usePatientClinicalSummary + useParameterDefinitions" />}
    >
      <HmsPageHeader
        title="Released Lab Result"
        description={`Detail view — Order ${result.orderId ?? orderId}`}
        badge="LIS Registry"
      />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 24px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 no-print">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Result Values */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-indigo-50 border-b border-slate-200 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                Result Values
              </span>
            </div>
            {resultsEntries.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {resultsEntries.map(({ key, value }) => {
                  const definition = parameterDefinitions?.find(
                    (d) => d.parameterName === key || d.code === key
                  );
                  return (
                    <div key={key} className="px-5 py-3.5 flex items-center justify-between font-mono">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 font-sans">{key}</span>
                        {definition && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            Range: {definition.referenceRangeText || '—'} {definition.unit || ''}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {String(value ?? '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No result values recorded.</p>
              </div>
            )}
          </div>

          {/* Remarks */}
          {result.remarks && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Remarks
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.remarks}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Status
              </span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <HmsStatusChip variant="success" status="Released" />
              </div>
              <div className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400">
                v{result.version}
              </div>
            </div>
          </div>

          {/* Timeline card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Timeline
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <Eye className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Validated
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {result.validatedAt
                      ? format(new Date(result.validatedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.validatedById && (
                    <p className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400 mt-0.5">
                      {result.validatedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Released
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {result.releasedAt
                      ? format(new Date(result.releasedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.releasedById && (
                    <p className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400 mt-0.5">
                      {result.releasedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scope notice */}
          <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="font-medium space-y-1">
              <p>
                This result has been <strong>released</strong> for clinical visibility.
              </p>
              <p>
                Notification, billing integration, and patient portal delivery are
                separate workflows and are not available in this view.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Layout Section */}
      <div className="hidden print-section print:block">
        <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">HMS Core Medical Center</h1>
          <p className="text-xs text-slate-600">123 Health Ave, Medical City | Tel: (02) 123-4567</p>
          <h2 className="text-lg font-bold mt-4 text-slate-805 tracking-wider">OFFICIAL LABORATORY REPORT</h2>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-xs border-b border-slate-200 pb-4">
          <div><span className="font-bold">Patient Name:</span> {patientSummary?.patientName?.toUpperCase() || 'N/A'}</div>
          <div><span className="font-bold">Date of Report:</span> {result.releasedAt ? format(new Date(result.releasedAt), 'yyyy-MM-dd hh:mm a') : format(new Date(), 'yyyy-MM-dd hh:mm a')}</div>
          <div><span className="font-bold">Patient ID (MRN):</span> {patientSummary?.patientNumber || 'N/A'}</div>
          <div><span className="font-bold">Requested By:</span> Attending Physician</div>
          <div><span className="font-bold">Age / Gender:</span> {patientSummary?.dob ? `${differenceInYears(new Date(), new Date(patientSummary.dob))} yrs` : 'N/A'} / {patientSummary?.gender || 'N/A'}</div>
          <div><span className="font-bold">LIS Access Code:</span> {result.orderId || 'N/A'}</div>
        </div>

        {/* Results Table */}
        <div className="mb-12">
          <h3 className="font-bold text-sm border-b border-slate-300 pb-1.5 mb-3 uppercase tracking-wider bg-slate-50 px-2 py-0.5">Laboratory Analysis</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-350 font-bold uppercase">
                <th className="py-2 px-2">Assay Parameter</th>
                <th className="py-2 px-2 text-right">Result Value</th>
                <th className="py-2 px-2">Unit</th>
                <th className="py-2 px-2">Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {resultsEntries.length > 0 ? (
                resultsEntries.map(({ key, value }) => {
                  const definition = parameterDefinitions?.find(
                    (d) => d.parameterName === key || d.code === key
                  );
                  return (
                    <tr key={key} className="border-b border-slate-100">
                      <td className="py-2.5 px-2 font-bold text-slate-800">{key}</td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900">{String(value ?? '—')}</td>
                      <td className="py-2.5 px-2 text-slate-650 font-mono text-[10px]">{definition?.unit || '—'}</td>
                      <td className="py-2.5 px-2 text-slate-650 font-mono text-[10px]">{definition?.referenceRangeText || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400 italic">No result values recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-200">
          <div className="text-center">
            <div className="h-10 flex items-end justify-center mb-1 font-mono text-xs italic text-slate-500">
              {result.validatedById ? `Digitally Signed: ${result.validatedById}` : 'Jane Smith, RMT'}
            </div>
            <div className="border-t border-slate-450 pt-1.5">
              <p className="font-bold text-xs">Medical Technologist</p>
              <p className="text-[10px] text-slate-500">Lic. No: 123456</p>
            </div>
          </div>
          <div className="text-center">
            <div className="h-10 flex items-end justify-center mb-1 font-mono text-xs italic text-slate-500">
              {result.releasedById ? `Authorized Release: ${result.releasedById}` : 'Dr. Alan Pathologist, MD'}
            </div>
            <div className="border-t border-slate-455 pt-1.5">
              <p className="font-bold text-xs">Attending Pathologist</p>
              <p className="text-[10px] text-slate-500">Lic. No: 987654</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amendment Modal */}
      {showAmendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4 border-b border-slate-100 pb-4">
              <div className="p-2 bg-rose-50 rounded-lg">
                <FileWarning className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Request Amendment</h3>
                <p className="text-xs text-slate-500">Requires clinical supervisor authorization.</p>
              </div>
            </div>

            {amendError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-700">
                {amendError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-650">
                You are about to submit an amendment request for this released lab result. The active report will be flag-tagged as undergoing correction.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Reason for Amendment (Required)
                </label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="e.g. Recalibrated WBC counts, correcting typo from 12.5 to 1.25..."
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowAmendModal(false);
                  setAmendReason('');
                  setAmendError(null);
                }}
                className="btn btn-secondary py-2"
                disabled={submittingAmend}
              >
                Cancel
              </button>
              <button
                onClick={handleAmendRequest}
                disabled={!amendReason.trim() || submittingAmend}
                className="btn btn-danger py-2 bg-rose-600 hover:bg-rose-700 flex items-center gap-2 border-none text-white font-bold"
              >
                {submittingAmend && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default ReleasedResultDetailPage;