import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { LabOrderHeader } from './components/LabOrderHeader';
import { ResultFlagBadge, ResultFlag } from './components/ResultFlagBadge';
import { useSaveDraftLabResult, useLabDraftEncodingContext, useParameterDefinitions } from '../../hooks/use-clinical-workflow';
import type { LabResultDraftContextDto, LabParameterDefinitionDto } from '../../services/clinicalWorkflow.service';
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

function buildHeaderOrder(ctx: LabResultDraftContextDto) {
  const age = computeAge(ctx.dob);
  const dobStr = new Date(ctx.dob).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return {
    id: ctx.orderNumber,
    patientName: ctx.patientName,
    patientAge: age,
    patientGender: '',
    mrn: ctx.patientNumber,
    dob: dobStr,
    accessCode: ctx.accessionNumber || ctx.orderNumber,
    physician: '',
    department: '',
    billingStatus: undefined,
  };
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

    /* eslint-disable react-hooks/set-state-in-effect */
    setParameters(rows);
    setRemarks(context.draftRemarks || '');
    /* eslint-enable react-hooks/set-state-in-effect */
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
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-semibold">Loading encoding context...</p>
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
    let icon = <AlertCircle className="h-8 w-8 text-rose-400" />;

    if (isAuth) {
      title = 'Access Denied';
      message = 'You do not have permission to access this lab order.';
      icon = <Ban className="h-8 w-8 text-rose-400" />;
    } else if (is404) {
      title = 'Order Not Found';
      message = 'This lab order could not be found. It may have been removed or the link is invalid.';
      icon = <AlertTriangle className="h-8 w-8 text-amber-400" />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {icon}
        <div className="text-center">
          <h3 className="text-sm font-black text-slate-700">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">{message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn text-xs font-bold px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100"
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
        <div className="text-center">
          <h3 className="text-sm font-black text-slate-500">No Data Available</h3>
          <p className="text-xs text-slate-400 mt-1">No encoding context was returned for this order.</p>
        </div>
      </div>
    );
  }

  const headerOrder = buildHeaderOrder(context);
  const panelName = context.panelName || 'Lab Panel';
  const hasNoCatalog = !catLoading && !catError && (!definitions || definitions.length === 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Diagnostic Result Encoding"
          description="Enter verified assay parameters from laboratory analyzers. Reference ranges sourced from lab test catalog."
        />

        <div className="flex items-center gap-2">
          {catLoading && (
            <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Catalog
            </div>
          )}
          {hasNoCatalog && (
            <div className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl select-none flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              No Parameter Catalog
            </div>
          )}
          <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
            Assay Entry Console
          </div>
          <div className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl select-none">
            {context.draftStatus || 'New'}
          </div>
        </div>
      </div>

      {hasNoCatalog && parameters.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-700">
          <Database className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>No parameter catalog configured for this panel. Existing draft values are displayed without reference ranges.</span>
        </div>
      )}

      <LabOrderHeader order={headerOrder} />

      {successBanner && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700 animate-scale-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>Draft saved successfully.</span>
        </div>
      )}

      {saveDraftMutation.isError && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>Failed to save draft. Please try again.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">

            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">
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
                  <tr className="bg-slate-50/60 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                    <th scope="col" className="px-6 py-3.5">Parameter / Analyzer Test</th>
                    <th scope="col" className="px-6 py-3.5 w-36">Encoded Value</th>
                    <th scope="col" className="px-6 py-3.5">Flag</th>
                    <th scope="col" className="px-6 py-3.5">Unit</th>
                    <th scope="col" className="px-6 py-3.5">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                        No test parameters defined for this panel.
                      </td>
                    </tr>
                  ) : (
                    parameters.map((param, index) => {
                      const currentFlag = evaluateFlag(param);
                      const isCrit = currentFlag === 'Critical';

                      return (
                        <tr key={index} className={`hover:bg-slate-50/30 transition-all ${isCrit ? 'bg-rose-50/20' : ''}`}>
                          <td className="px-6 py-4 font-black text-slate-800">{param.name}</td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              aria-label={`Value for ${param.name}`}
                              className={`input text-xs py-1.5 w-28 rounded-lg font-bold text-center ${
                                isCrit
                                  ? 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-rose-200'
                                  : 'border-slate-200 text-slate-800 focus:ring-indigo-200'
                              }`}
                              required
                            />
                          </td>
                          <td className="px-6 py-4">
                            <ResultFlagBadge flag={currentFlag} />
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{param.unit}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{param.refRange}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-slate-50/40 border-t border-slate-100 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Med-Tech Observations & Internal Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Log any sample anomalies, hemolyzation details, or analyzer warning codes..."
                className="input min-h-[90px] text-xs py-2 w-full rounded-xl bg-white border border-slate-200"
              />
            </div>

          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Diagnostic Attachments
            </h3>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 hover:border-indigo-400 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                aria-label="Upload analyzer printout"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">
                {fileName ? (
                  <span className="text-indigo-600 font-bold block truncate">{fileName}</span>
                ) : (
                  <span>Drag & drop analyzer printout PDF/Image here</span>
                )}
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Supports PDF, PNG, JPG up to 10MB</span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
              className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveDraftMutation.isPending ? 'Saving Draft...' : 'Save Draft'}
            </button>

            {saveDraftMutation.isError && (
              <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Failed to save draft. Please try again.</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400 font-medium text-center leading-normal">
              Draft result encoding only. Once validation is available, results will route to the validation panel.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ResultEncodingPage;
