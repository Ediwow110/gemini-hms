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
  on_track: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  at_risk: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  breached: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const HmsSlaPanel = ({ title, description, items, loading }: HmsSlaPanelProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
        <div className="mb-3 h-4 w-32 rounded bg-slate-100" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2.5">
        <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
        {description && <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          const barWidth = item.threshold && item.current !== undefined
            ? Math.min(100, (item.current / item.threshold) * 100)
            : 0;
          const barColor = item.status === 'breached' ? 'bg-rose-500'
            : item.status === 'at_risk' ? 'bg-amber-500'
            : 'bg-emerald-500';

          const handleClick = () => {
            if (item.drilldownHref) navigate(item.drilldownHref);
          };

          return (
            <div
              key={item.id}
              className={`px-3 py-2.5 ${item.drilldownHref ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
              onClick={handleClick}
              role={item.drilldownHref ? 'button' : undefined}
              tabIndex={item.drilldownHref ? 0 : undefined}
              onKeyDown={item.drilldownHref ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${cfg.color}`} aria-hidden="true" />
                  <span className="text-[13px] font-medium text-slate-700 truncate">{item.label}</span>
                </div>
                <span className="text-[14px] font-mono font-bold text-slate-900 flex-shrink-0">{item.value}</span>
              </div>
              {item.threshold && item.current !== undefined && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-medium ${cfg.color}`}>
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
