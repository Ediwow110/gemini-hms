import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { HmsPageHeader, HmsSafetyBar } from '../../components/hms-page';
import { ResultFlagBadge, ResultFlag } from './components/ResultFlagBadge';
import { useSaveDraftLabResult, useLabDraftEncodingContext, useParameterDefinitions } from '../../hooks/use-clinical-workflow';
import type { LabParameterDefinitionDto } from '../../services/clinicalWorkflow.service';
import {
  Upload,
  Save,
  FlaskConical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Database,
  Hash,
  UserCheck,
  BriefcaseMedical,
  CreditCard,
} from 'lucide-react';

interface ParameterRow {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  minNormal: number;
  maxNormal: number;
  minCrit?: number;
  maxCrit?: number;
}

function computeAge(dob: Date): number {
  const now = new Date();
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export const ResultEncodingPage = () => {
  const { patientId, orderId } = useParams<{ patientId: string; orderId: string }>();

  const { data: context, isLoading, isError, error, refetch } = useLabDraftEncodingContext(patientId || '', orderId || '');
  const { data: definitions, isLoading: catLoading, isError: catError } = useParameterDefinitions(orderId || '');

  const [parameters, setParameters] = useState<ParameterRow[]>([]);
  const [remarks, setRemarks] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);

  const saveDraftMutation = useSaveDraftLabResult();

  const mergeWithDefinitions = useCallback(
    (saved: Record<string, string> | undefined, defs: LabParameterDefinitionDto[] | undefined): ParameterRow[] => {
      const rows: ParameterRow[] = [];

      if (defs && defs.length > 0) {
        const defMap = new Map(defs.map((d) => [d.code, d]));
        defMap.set(defs[0]?.parameterName || '', defs[0]);

        if (saved && Object.keys(saved).length > 0) {
          for (const [key, val] of Object.entries(saved)) {
            const def = defMap.get(key) || defs.find((d) => d.parameterName === key);
            if (def) {
              rows.push({
                name: def.parameterName,
                value: val,
                unit: def.unit || '',
                refRange: def.referenceRangeText || '—',
                minNormal: def.minNormal ?? -Infinity,
                maxNormal: def.maxNormal ?? Infinity,
                minCrit: def.minCritical,
                maxCrit: def.maxCritical,
              });
            } else {
              rows.push({
                name: key,
                value: val,
                unit: '',
                refRange: '—',
                minNormal: -Infinity,
                maxNormal: Infinity,
              });
            }
          }
        } else {
          for (const def of defs) {
            rows.push({
              name: def.parameterName,
              value: '',
              unit: def.unit || '',
              refRange: def.referenceRangeText || '—',
              minNormal: def.minNormal ?? -Infinity,
              maxNormal: def.maxNormal ?? Infinity,
              minCrit: def.minCritical,
              maxCrit: def.maxCritical,
            });
          }
        }
      } else if (saved && Object.keys(saved).length > 0) {
        for (const [key, val] of Object.entries(saved)) {
          rows.push({
            name: key,
            value: val,
            unit: '',
            refRange: '—',
            minNormal: -Infinity,
            maxNormal: Infinity,
          });
        }
      }

      return rows;
    },
    [],
  );

  useEffect(() => {
    if (!context) return;
    if (parameters.length > 0) return;
    if (catLoading) return;

    const saved = context.draftResults as Record<string, string> | undefined;
    const rows = mergeWithDefinitions(saved, definitions);

    if (rows.length === 0) {
      return;
    }

    setParameters(rows);
    setRemarks(context.draftRemarks || '');
  }, [context, definitions, catLoading, parameters.length, mergeWithDefinitions]);

  const evaluateFlag = (row: ParameterRow): ResultFlag => {
    const val = parseFloat(row.value);
    if (isNaN(val)) return 'Normal';
    if (row.minCrit && val <= row.minCrit) return 'Critical';
    if (row.maxCrit && val >= row.maxCrit) return 'Critical';
    if (val < row.minNormal) return 'Low';
    if (val > row.maxNormal) return 'High';
    return 'Normal';
  };

  const handleValueChange = (index: number, newValue: string) => {
    setParameters(parameters.map((p, idx) => idx === index ? { ...p, value: newValue } : p));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSaveDraft = useCallback(() => {
    if (!patientId || !orderId) return;

    const resultValues: Record<string, string> = {};
    parameters.forEach(p => {
      resultValues[p.name] = p.value;
    });

    saveDraftMutation.mutate(
      {
        patientId,
        orderId,
        data: {
          results: resultValues,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          setSuccessBanner(true);
          setTimeout(() => setSuccessBanner(false), 4000);
        },
      }
    );
  }, [patientId, orderId, parameters, remarks, saveDraftMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold font-sans">Loading encoding context...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const typedError = error as { response?: { status?: number } };
    const status = typedError?.response?.status;
    const isAuth = status === 401 || status === 403;
    const is404 = status === 404;
    let title = 'Failed to load encoding context';
    let message = 'An unexpected error occurred. Please try again.';
    let icon = <AlertCircle className="h-8 w-8 text-rose-500" />;

    if (isAuth) {
      title = 'Access Denied';
      message = 'You do not have permission to access this lab order.';
      icon = <Ban className="h-8 w-8 text-rose-500" />;
    } else if (is404) {
      title = 'Order Not Found';
      message = 'This lab order could not be found. It may have been removed or the link is invalid.';
      icon = <AlertTriangle className="h-8 w-8 text-amber-500" />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {icon}
        <div className="text-center font-sans">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-md">{message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="border border-slate-200 hover:bg-slate-50 text-slate-650 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-8 w-8 text-slate-300" />
        <div className="text-center font-sans">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Data Available</h3>
          <p className="text-[11px] text-slate-400 mt-1">No encoding context was returned for this order.</p>
        </div>
      </div>
    );
  }

  const age = computeAge(context.dob);
  const dobStr = new Date(context.dob).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const panelName = context.panelName || 'Lab Panel';
  const hasNoCatalog = !catLoading && !catError && (!definitions || definitions.length === 0);

  return (
    <div className="space-y-4 animate-fade-in font-sans text-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <HmsPageHeader
          title="Diagnostic Result Encoding"
          description="Enter verified assay parameters from laboratory analyzers. Reference ranges sourced from lab test catalog."
        />

        <div className="flex flex-wrap items-center gap-2">
          {catLoading && (
            <div className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg select-none flex items-center gap-1.5 font-mono">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Catalog
            </div>
          )}
          {hasNoCatalog && (
            <div className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg select-none flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              No Parameter Catalog
            </div>
          )}
          <div className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg select-none">
            Assay Entry Console
          </div>
          <div className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg select-none">
            {context.draftStatus || 'New'}
          </div>
        </div>
      </div>

      <HmsSafetyBar
        patientName={context.patientName}
        mrn={context.patientNumber}
        dob={dobStr}
        age={age}
        gender="Unavailable"
        allergies="Unavailable"
        insurance="Unavailable"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lab Order ID</span>
          <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
            <Hash className="h-3 w-3 text-slate-400" />
            {context.orderNumber}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Code</span>
          <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-slate-400" />
            {context.accessionNumber || context.orderNumber}
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

      {hasNoCatalog && parameters.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700">
          <Database className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>No parameter catalog configured for this panel. Existing draft values are displayed without reference ranges.</span>
        </div>
      )}

      {successBanner && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-xs font-semibold text-emerald-700 animate-scale-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Draft saved successfully.</span>
        </div>
      )}

      {saveDraftMutation.isError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>Failed to save draft. Please check connection and try again.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
                  {panelName}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
                Specimen ID: {context.specimenId.slice(0, 8)}...
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-bold uppercase border-b border-slate-200">
                    <th scope="col" className="px-4 py-2.5">Parameter / Analyzer Test</th>
                    <th scope="col" className="px-4 py-2.5 w-32 text-center">Encoded Value</th>
                    <th scope="col" className="px-4 py-2.5">Flag</th>
                    <th scope="col" className="px-4 py-2.5">Unit</th>
                    <th scope="col" className="px-4 py-2.5">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {parameters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400 font-medium font-sans">
                        No test parameters defined for this panel.
                      </td>
                    </tr>
                  ) : (
                    parameters.map((param, index) => {
                      const currentFlag = evaluateFlag(param);
                      const isCrit = currentFlag === 'Critical';

                      return (
                        <tr key={index} className={`hover:bg-slate-50/30 transition-all ${isCrit ? 'bg-rose-50/20' : ''}`}>
                          <td className="px-4 py-3 font-sans font-bold text-slate-800">{param.name}</td>
                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              aria-label={`Value for ${param.name}`}
                              className={`text-xs py-1 px-2.5 w-24 rounded-lg font-bold text-center border focus:outline-none focus:ring-2 ${
                                isCrit
                                  ? 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-rose-200'
                                  : 'border-slate-200 text-slate-800 focus:ring-blue-100'
                              }`}
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <ResultFlagBadge flag={currentFlag} />
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[10px]">{param.unit}</td>
                          <td className="px-4 py-3 text-slate-500 text-[10px]">{param.refRange}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/40 border-t border-slate-200 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Med-Tech Observations & Internal Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Log any sample anomalies, hemolyzation details, or analyzer warning codes..."
                className="w-full min-h-[80px] p-2.5 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
              Diagnostic Attachments
            </h3>

            <div className="border border-dashed border-slate-350 rounded-lg p-5 text-center space-y-2 hover:border-blue-500 transition-colors cursor-pointer relative bg-slate-50/30">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                aria-label="Upload analyzer printout"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-6 w-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">
                {fileName ? (
                  <span className="text-blue-600 font-bold block truncate">{fileName}</span>
                ) : (
                  <span>Upload analyzer printout</span>
                )}
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Supports PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
              className="w-full bg-blue-650 hover:bg-blue-750 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveDraftMutation.isPending ? 'Saving Draft...' : 'Save Draft'}
            </button>

            <p className="text-[10px] text-slate-450 font-medium text-center leading-normal">
              Saves as an editable draft. Validations can only be authorized once draft results are saved successfully.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultEncodingPage;
