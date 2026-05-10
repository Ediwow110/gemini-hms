import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "indigo" | "emerald" | "amber" | "rose" | "slate";
}

export const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "indigo",
}: MetricCardProps) => {
  const iconGradients = {
    indigo: "from-indigo-500 to-violet-500 shadow-indigo-200/50",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-200/50",
    amber: "from-amber-500 to-orange-500 shadow-amber-200/50",
    rose: "from-rose-500 to-pink-500 shadow-rose-200/50",
    slate: "from-slate-500 to-slate-600 shadow-slate-200/50",
  };

  const trendBg = {
    positive: "bg-emerald-50 text-emerald-700",
    negative: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="card-hover p-6 group">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconGradients[color]} shadow-md`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${trend.isPositive ? trendBg.positive : trendBg.negative}`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {value}
        </p>
        {description && <p className="text-xs text-slate-400 mt-1.5">{description}</p>}
      </div>
    </div>
  );
};
