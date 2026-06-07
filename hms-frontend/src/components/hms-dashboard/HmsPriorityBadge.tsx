export type PriorityLevel = 'emergency' | 'critical' | 'urgent' | 'routine';

interface HmsPriorityBadgeProps {
  level: PriorityLevel;
  showLabel?: boolean;
  className?: string;
}

const priorityConfig: Record<PriorityLevel, { dot: string; label: string; text: string }> = {
  emergency: { dot: 'bg-rose-500', label: 'EMERGENCY', text: 'text-rose-700' },
  critical: { dot: 'bg-amber-500', label: 'CRITICAL', text: 'text-amber-700' },
  urgent: { dot: 'bg-blue-500', label: 'URGENT', text: 'text-blue-700' },
  routine: { dot: 'bg-slate-400', label: 'ROUTINE', text: 'text-slate-500' },
};

export const HmsPriorityBadge = ({ level, showLabel = true, className = '' }: HmsPriorityBadgeProps) => {
  const cfg = priorityConfig[level];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {showLabel && <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>}
    </span>
  );
};

export default HmsPriorityBadge;
