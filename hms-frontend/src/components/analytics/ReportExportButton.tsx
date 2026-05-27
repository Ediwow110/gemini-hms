import { Download, Lock } from 'lucide-react';

interface ReportExportButtonProps {
  label?: string;
  endpoint?: string;
  disabledReason?: string;
  sensitive?: boolean;
  requiresReason?: boolean;
  onExport?: () => Promise<void> | void;
}

export const ReportExportButton = ({
  label = 'Export report',
  endpoint,
  disabledReason = 'Export backend is not available yet. This action is disabled to prevent fake downloads.',
  sensitive = false,
  requiresReason = false,
  onExport,
}: ReportExportButtonProps) => {
  const enabled = Boolean(endpoint && onExport);
  const safetyNote = sensitive || requiresReason
    ? ' Sensitive export requires permission, reason capture, and audit trail before enablement.'
    : '';

  if (!enabled) {
    return (
      <span className="inline-flex flex-col gap-1">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={`${disabledReason}${safetyNote}`}
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-black text-slate-400"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          {label} WIP
        </button>
        <span className="max-w-xs text-[10px] font-semibold leading-snug text-slate-500">{disabledReason}{safetyNote}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
};

export default ReportExportButton;
