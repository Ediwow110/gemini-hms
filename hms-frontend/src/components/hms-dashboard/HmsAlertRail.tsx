import { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

interface HmsAlertRailProps {
  alerts: AlertItem[];
  maxVisible?: number;
  loading?: boolean;
}

const severityConfig: Record<string, { border: string; bg: string; text: string; icon: typeof AlertTriangle; iconColor: string }> = {
  critical: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-50/50',
    text: 'text-rose-800',
    icon: AlertTriangle,
    iconColor: 'text-rose-500',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50',
    text: 'text-amber-800',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
  },
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
};

const AlertRow = ({ alert }: { alert: AlertItem }) => {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 border-l-4 ${cfg.border} ${cfg.bg} rounded-r-lg px-3 py-2`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] font-semibold ${cfg.text}`}>{alert.title}</span>
          {alert.timestamp && (
            <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">{alert.timestamp}</span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-slate-600">{alert.message}</p>
        {(alert.actionLabel) && (
          <div className="mt-1.5">
            {alert.actionHref ? (
              <a
                href={alert.actionHref}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {alert.actionLabel} →
              </a>
            ) : (
              <button
                type="button"
                onClick={alert.actionOnClick}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {alert.actionLabel} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const HmsAlertRail = ({ alerts, maxVisible = 3, loading }: HmsAlertRailProps) => {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-10 w-full rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span className="text-[12px] font-medium text-emerald-700">All clear — no alerts</span>
      </div>
    );
  }

  const visible = showAll ? alerts : alerts.slice(0, maxVisible);
  const remaining = alerts.length - maxVisible;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((a) => (
        <AlertRow key={a.id} alert={a} />
      ))}
      {alerts.length > maxVisible && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 self-start text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showAll ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show {remaining} more <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default HmsAlertRail;
