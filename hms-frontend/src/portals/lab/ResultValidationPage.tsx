import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HmsPageHeader, HmsSafetyBar } from '../../components/hms-page';
import { ResultFlagBadge } from './components/ResultFlagBadge';
import {
  FileCheck2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  TrendingDown,
  Loader2,
  Hash,
  UserCheck,
  BriefcaseMedical,
  CreditCard,
} from 'lucide-react';
import { useLabDraftEncodingContext, useValidateLabResult } from '../../hooks/use-clinical-workflow';
import type { LabResultDraftContextDto } from '../../services/clinicalWorkflow.service';
import axios from 'axios';
import {
  HmsDashboardShell,
  HmsAuditFooter,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
} from '../../components/hms-dashboard';

interface VerifiedParameter {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
  previousValue?: string;
}

function determineFlag(
  value: number,
  min?: number,
  max?: number
): 'Normal' | 'High' | 'Low' | 'Critical' {
  if (max !== undefined && value > max * 1.5) return 'Critical';
  if (min !== undefined && value < min * 0.5) return 'Critical';
  if (max !== undefined && value > max) return 'High';
  if (min !== undefined && value < min) return 'Low';
  return 'Normal';
}

function parseNumericValue(value: string): number | null {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function deriveParameters(context: LabResultDraftContextDto): VerifiedParameter[] {
  if (!context.draftResults) return [];
  return context.testItems.map((item) => {
    const rawValue = context.draftResults?.[item.itemName];
    const valueStr = String(rawValue ?? '');
    const numericValue = parseNumericValue(valueStr);
    return {
      name: item.itemName,
      value: valueStr,
      unit: '',
      refRange: '—',
      flag: numericValue !== null ? determineFlag(numericValue) : 'Normal',
      previousValue: undefined,
    };
  });
}

export const ResultValidationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const orderId = searchParams.get('orderId');

  const { data: context, isLoading: contextLoading, error: contextError, refetch } =
    useLabDraftEncodingContext(patientId || '', orderId || '');

  const validateMutation = useValidateLabResult();

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isLoading = contextLoading || validateMutation.isPending;
  const error = contextError || validateMutation.error;
  const isConflict =
    axios.isAxiosError(validateMutation.error) &&
    validateMutation.error.response?.status === 409;

  const handleApprove = async () => {
    if (!context || !patientId || !orderId) return;
    try {
      await validateMutation.mutateAsync({
        patientId,
        orderId,
        data: { version: context.draftVersion ?? 0 },
      });
      navigate('/lab/validated');
    } catch {
      // Error state is handled by the mutation
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    alert(`Results rejected and returned to encoder with remarks: "${rejectReason}"`);
    setRejectMode(false);
    setRejectReason('');
    navigate('/lab/orders');
  };

  if (!patientId || !orderId) {
    return (
      <div className="space-y-4 animate-fade-in font-sans text-slate-700">
        <HmsPageHeader
          title="Clinical Validation & QA Review"
          description="Select an encoded result from the work queue to validate."
        />
        <HmsDashboardShell footer={<HmsAuditFooter dataSource="Laboratory LIS Service" lastRefreshed={new Date()} />}>
          <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm text-center">
            <FileCheck2 className="h-10 w-10 text-slate-350 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">No Result Selected</h3>
            <p className="text-[11px] text-slate-450 max-w-xs mx-auto">
              Navigate to the Specimen Work Queue and select a result in "Encoded" status to begin validation.
            </p>
            <button
              onClick={() => navigate('/lab/orders')}
              className="mt-4 border border-slate-200 hover:bg-slate-50 text-slate-650 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Go to Lab Orders
            </button>
          </div>
        </HmsDashboardShell>
      </div>
    );
  }

  const parameters = context ? deriveParameters(context) : [];
  const panelName = context?.panelName || 'Laboratory Panel';
  const draftRemarks = context?.draftRemarks;
  const dobStr = context?.dob ? new Date(context.dob).toLocaleDateString() : '—';
  const age = context?.dob
    ? Math.floor(
        (new Date().getTime() - new Date(context.dob).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : 0;

  return (
    <div className="space-y-4 animate-fade-in font-sans text-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <HmsPageHeader
          title="Clinical Validation & QA Review"
          description="Perform supervisor verification of encoded parameters. Approve or return for correction."
        />

        <div className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg select-none">
          LIS Supervisor Station
        </div>
      </div>

      <HmsDashboardShell footer={<HmsAuditFooter dataSource="Laboratory LIS Service" lastRefreshed={new Date()} />}>
        {(isLoading && !context) ? (
          <HmsLoadingSkeleton rows={8} />
        ) : (error && !context) ? (
          <HmsDataUnavailable sectionName="Validation Context" expectedApi="GET /api/v1/lab/orders/:orderId/lab-draft-context" />
        ) : !context ? (
          <HmsDataUnavailable sectionName="Validation Context" expectedApi="GET /api/v1/lab/orders/:orderId/lab-draft-context" />
        ) : (
          <>
            <HmsSafetyBar
              patientName={context.patientName}
              mrn={context.patientNumber}
              dob={dobStr}
              age={age}
              gender="Unavailable"
              allergies="Unavailable"
              insurance="Unavailable"
            />

            {/* Lab Order Details & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lab Order ID</span>
                <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
                  <Hash className="h-3 w-3 text-slate-400" />
                  {context.orderNumber || context.orderId}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Code</span>
                <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-slate-400" />
                  {context.accessionNumber || context.orderId.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Physician / Source</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate font-mono">
                  <BriefcaseMedical className="h-3 w-3 text-slate-400" />
                  {context.requestedById || 'Unavailable'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Clearance</span>
                <div className="inline-block mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase select-none font-mono">
                    <CreditCard className="h-3 w-3" />
                    Prepaid
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Parameter Verification List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-blue-600" />
                      <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
                        Pending Verification: {panelName}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
                      Order: {context.orderNumber || context.orderId}
                    </span>
                  </div>

                  {/* Validation Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 text-slate-400 font-bold uppercase border-b border-slate-200">
                          <th className="px-4 py-2.5">Parameter</th>
                          <th className="px-4 py-2.5 text-center">Encoded Value</th>
                          <th className="px-4 py-2.5">Flag</th>
                          <th className="px-4 py-2.5">Unit</th>
                          <th className="px-4 py-2.5">Reference Range</th>
                          <th className="px-4 py-2.5">Delta Check (Prev)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {parameters.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium font-sans">
                              No encoded parameters found for this result.
                            </td>
                          </tr>
                        ) : (
                          parameters.map((param, index) => {
                            const isAlert = param.flag === 'Critical' || param.flag === 'High' || param.flag === 'Low';

                            return (
                              <tr
                                key={index}
                                className={`hover:bg-slate-50/30 transition-all ${param.flag === 'Critical' ? 'bg-rose-50/25' : ''}`}
                              >
                                <td className="px-4 py-3 font-sans font-bold text-slate-800">{param.name}</td>
                                <td className={`px-4 py-3 text-center font-bold text-sm ${isAlert ? 'text-blue-700' : 'text-slate-800'}`}>
                                  {param.value}
                                </td>
                                <td className="px-4 py-3">
                                  <ResultFlagBadge flag={param.flag} />
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-[10px]">{param.unit}</td>
                                <td className="px-4 py-3 text-slate-500 text-[10px]">{param.refRange}</td>
                                <td className="px-4 py-3 text-slate-500 font-sans text-[10px]">
                                  {param.previousValue ? (
                                    <span className="flex items-center gap-1 font-mono">
                                      {param.previousValue}
                                      <TrendingDown className="h-3.5 w-3.5 text-slate-400 font-sans" />
                                    </span>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Encoder Details Banner */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-650">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Encoded By</span>
                      <p className="flex items-center gap-1.5 font-mono">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {context.draftLastEditedById || 'Unavailable'}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {context.draftLastEditedAt
                          ? new Date(context.draftLastEditedAt).toLocaleString()
                          : '—'}
                      </p>
                    </div>

                    {draftRemarks && (
                      <div className="flex-1 max-w-sm bg-white border border-slate-200 p-3 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Med-Tech Remarks</span>
                        <p className="text-slate-600 italic">"{draftRemarks}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions and Decisions */}
              <div className="space-y-4">
                {rejectMode ? (
                  <form onSubmit={handleRejectSubmit} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg flex gap-2.5 text-xs">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-bold text-rose-800">Return to Encoder</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          This will discard approval, flag the results as rejected, and route it back to the entry queue.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Rejection Feedback Notes</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain what parameters need review or recalibration..."
                        className="w-full min-h-[80px] p-2.5 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-250/20"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Return to Entry Desk
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectMode(false)}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-650 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                      Validation Decision
                    </h3>

                    {isConflict && (
                      <div className="p-3 bg-amber-50 border border-amber-150 rounded-lg text-xs text-amber-800 font-semibold flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span>This result was modified by another user. Please refresh and try again.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => refetch()}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded transition-colors whitespace-nowrap"
                        >
                          Refresh Data
                        </button>
                      </div>
                    )}

                    {validateMutation.isError && !isConflict && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-750 font-semibold flex justify-between items-center gap-2">
                        <span>Validation failed. Please try again.</span>
                        <button
                          type="button"
                          onClick={() => refetch()}
                          className="px-2 py-1 bg-rose-650 hover:bg-rose-755 text-white text-[10px] font-bold rounded transition-colors whitespace-nowrap"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={isLoading || !context}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {validateMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        {validateMutation.isPending ? 'Validating...' : 'Approve & Sign Assay'}
                      </button>

                      <button
                        onClick={() => setRejectMode(true)}
                        disabled={isLoading}
                        className="w-full border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject & Return to Encoder
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium text-center leading-normal">
                      Approving this result will apply your supervisor signature and move the order to the validated queue.
                    </p>
                  </div>
                )}

                {/* Validation Guidelines */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg space-y-1.5 text-[11px] text-slate-600">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Supervisor QA Protocol</h4>
                  <ul className="list-disc pl-4 space-y-1 font-medium">
                    <li>Verify that specimen barcode IDs match the accession card perfectly.</li>
                    <li>Check delta values. Changes of &gt;20% must be audited for specimen mix-ups.</li>
                    <li>If any values fall in critical range, proceed with immediate physician contact before release.</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </HmsDashboardShell>
    </div>
  );
};

export default ResultValidationPage;
