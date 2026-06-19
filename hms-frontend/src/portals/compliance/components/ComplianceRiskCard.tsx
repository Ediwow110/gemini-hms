import React from 'react';
import { LucideIcon, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { RequirePermission } from '../../../components/ui/RequirePermission';

interface ComplianceRiskCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  actionPermission?: string;
}

export const ComplianceRiskCard: React.FC<ComplianceRiskCardProps> = ({
  title,
  value,
  icon: Icon,
  riskLevel,
  description,
  actionLabel,
  onActionClick,
  actionPermission,
}) => {
  const getRiskType = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'danger';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 border-rose-200';
      case 'HIGH':
        return 'bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${getRiskBg(riskLevel)}`}>
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <StatusBadge status={`Risk: ${riskLevel}`} type={getRiskType(riskLevel)} />
      </div>

      <div className="mt-4 space-y-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h4>
        <p className="text-2xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {value}
        </p>
        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>

      {actionLabel && (() => {
        const actionButton = (
          <button
            onClick={onActionClick}
            className="mt-4 w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {riskLevel === 'CRITICAL' && <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" />}
            {actionLabel}
          </button>
        );

        if (actionPermission) {
          return (
            <RequirePermission permission={actionPermission}>
              {actionButton}
            </RequirePermission>
          );
        }

        return actionButton;
      })()}
    </div>
  );
};
export default ComplianceRiskCard;
