import { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

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

const severityConfig: Record<string, { border: string; bg: string; text: string; icon: typeof AlertTriangle; iconColor: string; badge: string }> = {
  critical: {
    border: 'border-l-red-600',
    bg: 'bg-red-50',
    text: 'text-red-900',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    badge: 'bg-red-600 text-white',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    badge: 'bg-amber-500 text-white',
  },
  success: {
    border: 'border-l-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-600 text-white',
  },
};

const AlertRow = ({ alert }: { alert: AlertItem }) => {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 border border-slate-200 border-l-4 ${cfg.border} ${cfg.bg} rounded-sm px-3.5 py-2.5`}>
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[12px] font-bold uppercase tracking-wide ${cfg.text}`}>{alert.title}</span>
          {alert.timestamp && (
            <span className="text-[10px] font-mono font-medium text-slate-400 flex-shrink-0">{alert.timestamp}</span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">{alert.message}</p>
        {(alert.actionLabel) && (
          <div className="mt-1.5">
            {alert.actionHref ? (
              <a
                href={alert.actionHref}
                className="inline-flex items-center gap-1 rounded-sm bg-slate-800 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-slate-700"
              >
                {alert.actionLabel}
              </a>
            ) : (
              <button
                type="button"
                onClick={alert.actionOnClick}
                className="inline-flex items-center gap-1 rounded-sm bg-slate-800 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-slate-700"
              >
                {alert.actionLabel}
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
        <div className="h-12 w-full rounded-sm bg-slate-200" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-sm border border-emerald-300 bg-emerald-50 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        <span className="text-[12px] font-bold text-emerald-800">All systems nominal — no active alerts</span>
      </div>
    );
  }

  const visible = showAll ? alerts : alerts.slice(0, maxVisible);
  const remaining = alerts.length - maxVisible;

  return (
    <div className="flex flex-col gap-2" role="region" aria-label="Alerts">
      {visible.map((a) => (
        <AlertRow key={a.id} alert={a} />
      ))}
      {alerts.length > maxVisible && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 self-start rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          {showAll ? (
            <>Collapse <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>+{remaining} more <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default HmsAlertRail;
