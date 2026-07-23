import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface SlaItem {
  id: string;
  label: string;
  value: string | number;
  threshold?: number;
  current?: number;
  status: 'on_track' | 'at_risk' | 'breached';
  drilldownHref?: string;
}

interface HmsSlaPanelProps {
  title: string;
  description?: string;
  items: SlaItem[];
  loading?: boolean;
}

const statusConfig = {
  on_track: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-600', bar: 'bg-emerald-600' },
  at_risk: { icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  breached: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', dot: 'bg-red-600', bar: 'bg-red-600' },
};

export const HmsSlaPanel = ({ title, description, items, loading }: HmsSlaPanelProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-md border border-slate-300 bg-white p-4 animate-pulse shadow-sm">
        <div className="mb-3 h-3.5 w-28 rounded-sm bg-slate-200" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-sm bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="h-4 w-1 rounded-full bg-sky-600" aria-hidden="true" />
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">{title}</h3>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          const barWidth = item.threshold && item.current !== undefined
            ? Math.min(100, (item.current / item.threshold) * 100)
            : 0;

          const handleClick = () => {
            if (item.drilldownHref) navigate(item.drilldownHref);
          };

          return (
            <div
              key={item.id}
              className={`px-4 py-3 ${item.drilldownHref ? 'cursor-pointer transition-colors hover:bg-sky-50/60' : ''}`}
              onClick={handleClick}
              role={item.drilldownHref ? 'button' : undefined}
              tabIndex={item.drilldownHref ? 0 : undefined}
              onKeyDown={item.drilldownHref ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${cfg.color}`} aria-hidden="true" />
                  <span className="text-[12px] font-semibold text-slate-700 truncate">{item.label}</span>
                </div>
                <span className={`text-[13px] font-mono font-bold ${cfg.color} flex-shrink-0`}>{item.value}</span>
              </div>
              {item.threshold && item.current !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cfg.bar}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>
                    {item.current}/{item.threshold}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HmsSlaPanel;
