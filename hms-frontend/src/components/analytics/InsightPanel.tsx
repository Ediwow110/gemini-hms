import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Insight } from '../../types/analytics';

interface InsightPanelProps {
  insights: Insight[];
  title?: string;
}

const styles = {
  info: { box: 'border-indigo-100 bg-indigo-50 text-indigo-900', icon: Info },
  success: { box: 'border-emerald-100 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
  warning: { box: 'border-amber-100 bg-amber-50 text-amber-900', icon: AlertTriangle },
  critical: { box: 'border-rose-100 bg-rose-50 text-rose-900', icon: ShieldAlert },
};

export const InsightPanel = ({ insights, title = 'Decision insights' }: InsightPanelProps) => {
  const visibleInsights = insights.filter((insight) => insight.title.trim() && insight.description.trim());

  if (visibleInsights.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm" aria-label={title}>
      <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
      <div className="space-y-3">
        {visibleInsights.map((insight) => {
          const Icon = styles[insight.severity].icon;
          return (
            <div key={`${insight.title}-${insight.severity}`} className={`rounded-2xl border p-4 ${styles[insight.severity].box}`}>
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{insight.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed opacity-80">{insight.description}</p>
                  {insight.actionLabel && insight.actionTo && (
                    <Link to={insight.actionTo} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-white/70 px-3 py-2 text-xs font-black underline-offset-2 hover:underline">
                      {insight.actionLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InsightPanel;
