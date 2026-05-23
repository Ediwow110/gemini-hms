import {
  User,
  Calendar,
  UserCheck,
  Hash,
  BriefcaseMedical,
  CreditCard,
} from 'lucide-react';

export interface LabOrderHeaderProps {
  order: {
    id: string;
    patientName: string;
    patientAge: number;
    patientGender?: string;
    mrn: string;
    dob: string;
    accessCode: string;
    physician?: string;
    department?: string;
    billingStatus?: 'Prepaid' | 'HMO Cleared' | 'Pending Payment' | 'On Account';
    insuranceProvider?: string;
  };
  className?: string;
}

export const LabOrderHeader = ({ order, className = '' }: LabOrderHeaderProps) => {
  const getBillingBadgeColor = (status?: string) => {
    switch (status) {
      case 'Prepaid':
      case 'HMO Cleared':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Pending Payment':
        return 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200/60';
    }
  };

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl border-l-4 border-l-indigo-500 flex flex-col md:flex-row justify-between gap-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200/50 flex-shrink-0 select-none">
          {order.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
              {order.patientName}
            </h2>
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-indigo-150 text-indigo-700 bg-indigo-50">
              Patient ID: {order.mrn}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {order.patientAge}Y{order.patientGender ? ` / ${order.patientGender}` : ''}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> DOB: {order.dob}</span>
          </div>

          {order.insuranceProvider && (
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">
              Insurance: <strong className="text-slate-600">{order.insuranceProvider}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:border-l border-slate-100 md:pl-6 flex-1 max-w-2xl">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lab Order ID</span>
          <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1"><Hash className="h-3 w-3 text-slate-400" /> {order.id}</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Access Code</span>
          <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1"><UserCheck className="h-3 w-3 text-slate-400" /> {order.accessCode}</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Physician / Source</span>
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate"><BriefcaseMedical className="h-3 w-3 text-slate-400" /> {order.physician || 'N/A'}</span>
          {order.department && (
            <span className="text-[9px] text-slate-400 font-bold uppercase block">{order.department}</span>
          )}
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Billing Clearance</span>
          <div className="inline-block mt-0.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase select-none ${getBillingBadgeColor(order.billingStatus)}`}>
              <CreditCard className="h-3 w-3" />
              {order.billingStatus || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabOrderHeader;
