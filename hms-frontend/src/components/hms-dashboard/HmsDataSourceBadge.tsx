import { Database, FlaskConical, Radio, WifiOff } from 'lucide-react';

export type HmsDataSourceMode = 'live' | 'demo' | 'prototype' | 'offline';

interface HmsDataSourceBadgeProps {
  mode: HmsDataSourceMode;
  label?: string;
}

const config: Record<
  HmsDataSourceMode,
  { label: string; className: string; icon: typeof Radio }
> = {
  live: {
    label: 'Live data',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: Radio,
  },
  demo: {
    label: 'Synthetic demo',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: FlaskConical,
  },
  prototype: {
    label: 'Prototype data',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Database,
  },
  offline: {
    label: 'Live source offline',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: WifiOff,
  },
};

export const HmsDataSourceBadge = ({ mode, label }: HmsDataSourceBadgeProps) => {
  const item = config[mode];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.className}`}
      title={
        mode === 'demo' || mode === 'prototype'
          ? 'This dashboard is displaying synthetic, non-production data.'
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? item.label}
    </span>
  );
};

export default HmsDataSourceBadge;
