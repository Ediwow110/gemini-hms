

type StatusType = 'pending' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

export const StatusBadge = ({ status, type }: StatusBadgeProps) => {
  const getBadgeStyles = (statusVal: string, explicitType?: StatusType) => {
    const value = statusVal.toLowerCase();
    
    let colorType: StatusType = 'info';
    if (explicitType) {
      colorType = explicitType;
    } else if (
      value.includes('active') ||
      value.includes('completed') ||
      value.includes('released') ||
      value.includes('success') ||
      value.includes('approve') ||
      value.includes('verified')
    ) {
      colorType = 'success';
    } else if (
      value.includes('pending') ||
      value.includes('process') ||
      value.includes('progress') ||
      value.includes('review')
    ) {
      colorType = 'warning';
    } else if (
      value.includes('cancel') ||
      value.includes('reject') ||
      value.includes('fail') ||
      value.includes('delete') ||
      value.includes('error') ||
      value.includes('unauthorized')
    ) {
      colorType = 'danger';
    } else if (
      value.includes('draft') ||
      value.includes('hold') ||
      value.includes('wait')
    ) {
      colorType = 'pending';
    }

    switch (colorType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'info':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyles(
        status,
        type
      )}`}
    >
      {status}
    </span>
  );
};
