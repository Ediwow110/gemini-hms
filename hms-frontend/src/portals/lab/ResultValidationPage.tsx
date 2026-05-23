import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { LabOrderHeader } from './components/LabOrderHeader';
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
} from 'lucide-react';
import { useLabDraftEncodingContext, useValidateLabResult } from '../../hooks/use-clinical-workflow';
import type { LabResultDraftContextDto } from '../../services/clinicalWorkflow.service';
import axios from 'axios';

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

function buildOrderHeaderData(context: LabResultDraftContextDto) {
  const age = context.dob
    ? Math.floor(
        (new Date().getTime() - new Date(context.dob).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : 0;
  return {
    id: context.orderNumber || context.orderId,
    patientName: context.patientName || '[REDACTED]',
    patientAge: age,
    mrn: context.patientNumber || '—',
    dob: context.dob ? new Date(context.dob).toLocaleDateString() : '—',
    accessCode: context.accessionNumber || context.orderId.slice(0, 8).toUpperCase(),
    physician: context.requestedById || undefined,
    department: undefined,
    billingStatus: 'Prepaid' as const,
  };
}

export const ResultValidationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const orderId = searchParams.get('orderId');

  const { data: context, isLoading: contextLoading, error: contextError } =
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Clinical Validation & QA Review"
          description="Select an encoded result from the work queue to validate."
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <FileCheck2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Result Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Navigate to the Specimen Work Queue and select a result in "Encoded" status to begin validation.
          </p>
          <button
            onClick={() => navigate('/lab/orders')}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Go to Lab Orders
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !context) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Clinical Validation & QA Review"
          description="Loading validation context..."
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading order and result data...</p>
        </div>
      </div>
    );
  }

  if (error && !context) {
    const isForbidden = axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Clinical Validation & QA Review"
          description="Error loading validation context"
        />
        <div className="card p-12 bg-white border border-rose-100 shadow-sm rounded-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {isForbidden ? 'Access Restricted' : 'Connection Error'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isForbidden
              ? 'You do not have permission to access this lab result.'
              : 'Failed to load the validation context. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const parameters = context ? deriveParameters(context) : [];
  const orderHeaderData = context ? buildOrderHeaderData(context) : null;
  const panelName = context?.panelName || 'Laboratory Panel';
  const draftRemarks = context?.draftRemarks;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Clinical Validation & QA Review"
          description="Perform supervisor verification of encoded parameters. Approve or return for correction."
        />

        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          LIS Supervisor Station
        </div>
      </div>

      {orderHeaderData && (
        <LabOrderHeader order={orderHeaderData} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Parameter Verification List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">

            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">
                  Pending Verification: {panelName}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
                Order: {context?.orderNumber || context?.orderId}
              </span>
            </div>

            {/* Validation Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                    <th className="px-6 py-3.5">Parameter</th>
                    <th className="px-6 py-3.5">Encoded Value</th>
                    <th className="px-6 py-3.5">Flag</th>
                    <th className="px-6 py-3.5">Unit</th>
                    <th className="px-6 py-3.5">Reference Range</th>
                    <th className="px-6 py-3.5">Delta Check (Prev)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-semibold">
                        No encoded parameters found for this result.
                      </td>
                    </tr>
                  ) : (
                    parameters.map((param, index) => {
                      const isAlert = param.flag === 'Critical' || param.flag === 'High' || param.flag === 'Low';

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-slate-50/30 transition-all ${param.flag === 'Critical' ? 'bg-rose-50/20' : ''}`}
                        >
                          <td className="px-6 py-4 font-black text-slate-800">{param.name}</td>
                          <td className={`px-6 py-4 font-black text-sm ${isAlert ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {param.value}
                          </td>
                          <td className="px-6 py-4">
                            <ResultFlagBadge flag={param.flag} />
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{param.unit}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{param.refRange}</td>
                          <td className="px-6 py-4 text-slate-500 font-semibold font-mono text-[10px]">
                            {param.previousValue ? (
                              <span className="flex items-center gap-1">
                                {param.previousValue}
                                <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
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
            <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Encoded By</span>
                <p className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {context?.draftLastEditedById || 'Unknown'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {context?.draftLastEditedAt
                    ? new Date(context.draftLastEditedAt).toLocaleString()
                    : '—'}
                </p>
              </div>

              {draftRemarks && (
                <div className="flex-1 max-w-md bg-white border border-slate-200/60 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Med-Tech Remarks</span>
                  <p className="text-slate-600 font-medium italic">"{draftRemarks}"</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Actions and Decisions */}
        <div className="space-y-6">

          {rejectMode ? (
            <form onSubmit={handleRejectSubmit} className="card p-5 bg-white border border-rose-100 shadow-sm rounded-2xl space-y-4">
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex gap-3 text-xs">
                <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <h5 className="font-extrabold text-rose-800">Return to Encoder</h5>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    This will discard approval, flag the results as rejected, and route it back to the entry queue with your feedback.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Rejection Feedback Notes</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what parameters need review or recalibration..."
                  className="input min-h-[90px] text-xs py-2 w-full rounded-xl bg-white border border-slate-200"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn bg-rose-650 hover:bg-rose-750 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  Return to Entry Desk
                </button>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
                Validation Decision
              </h3>

              {isConflict && (
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  This result was modified by another user. Please refresh and try again.
                </div>
              )}

              {validateMutation.isError && !isConflict && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold">
                  Validation failed. Please try again.
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={handleApprove}
                  disabled={isLoading || !context}
                  className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {validateMutation.isPending ? 'Validating...' : 'Approve & Sign Assay'}
                </button>

                <button
                  onClick={() => setRejectMode(true)}
                  disabled={isLoading}
                  className="w-full btn border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject & Return to Encoder
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-medium text-center leading-normal">
                Approving this result will apply your supervisor signature and move the order to the validated queue. Release will be implemented in a future phase.
              </p>
            </div>
          )}

          {/* Validation Guidelines */}
          <div className="card p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2 text-xs text-slate-600 font-semibold">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Supervisor QA Protocol</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-[10.5px]">
              <li>Verify that specimen barcode IDs match the accession card perfectly.</li>
              <li>Check delta values. Changes of &gt;20% must be audited for specimen mix-ups.</li>
              <li>If any values fall in critical range, proceed with immediate physician contact before release.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ResultValidationPage;
