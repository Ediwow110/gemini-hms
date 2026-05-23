import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Step {
  label: string;
  icon: LucideIcon;
  completed: boolean;
}

interface OrderTrackingTimelineProps {
  steps: Step[];
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({ steps }) => {
  return (
    <div className="flex items-center gap-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 flex-1 last:flex-none">
          <step.icon className={`h-4 w-4 ${step.completed ? 'text-emerald-500' : 'text-slate-200'}`} />
          <span className={`text-[9px] font-black uppercase tracking-tight hidden sm:block ${step.completed ? 'text-slate-700' : 'text-slate-300'}`}>{step.label}</span>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step.completed ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
        </div>
      ))}
    </div>
  );
};

export default OrderTrackingTimeline;
