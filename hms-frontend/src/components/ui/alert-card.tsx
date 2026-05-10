import { LucideIcon } from "lucide-react";

interface AlertCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  severity: "info" | "warning" | "error" | "success";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const AlertCard = ({
  title,
  description,
  icon: Icon,
  severity,
  action,
}: AlertCardProps) => {
  const severityStyles = {
    info: {
      card: "bg-blue-50/80 border-blue-200/60",
      stripe: "bg-gradient-to-b from-blue-400 to-blue-500",
      icon: "text-blue-500 bg-blue-100",
      title: "text-blue-900",
      text: "text-blue-700",
      btn: "text-blue-700 hover:bg-blue-100",
    },
    warning: {
      card: "bg-amber-50/80 border-amber-200/60",
      stripe: "bg-gradient-to-b from-amber-400 to-amber-500",
      icon: "text-amber-600 bg-amber-100",
      title: "text-amber-900",
      text: "text-amber-700",
      btn: "text-amber-700 hover:bg-amber-100",
    },
    error: {
      card: "bg-rose-50/80 border-rose-200/60 animate-alert-pulse",
      stripe: "bg-gradient-to-b from-rose-400 to-rose-500",
      icon: "text-rose-500 bg-rose-100",
      title: "text-rose-900",
      text: "text-rose-700",
      btn: "text-rose-700 hover:bg-rose-100",
    },
    success: {
      card: "bg-emerald-50/80 border-emerald-200/60",
      stripe: "bg-gradient-to-b from-emerald-400 to-emerald-500",
      icon: "text-emerald-500 bg-emerald-100",
      title: "text-emerald-900",
      text: "text-emerald-700",
      btn: "text-emerald-700 hover:bg-emerald-100",
    },
  };

  const styles = severityStyles[severity];

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3.5 relative overflow-hidden ${styles.card}`}>
      {/* Left gradient stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.stripe}`} />
      
      <div className={`flex-shrink-0 p-1.5 rounded-lg ${styles.icon} mt-0.5`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pl-0.5">
        <h4 className={`text-sm font-bold ${styles.title}`}>{title}</h4>
        <p className={`text-xs mt-0.5 ${styles.text} opacity-80`}>{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${styles.btn}`}
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
};
