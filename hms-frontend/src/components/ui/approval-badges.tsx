export const ApprovalRiskBadge = ({ risk }: { risk: 'Low' | 'Medium' | 'High' | 'Critical' }) => {
  const styles = {
    Low: "bg-slate-50 text-slate-600 border border-slate-200/60",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200/60",
    High: "bg-orange-50 text-orange-700 border border-orange-200/60",
    Critical: "bg-rose-50 text-rose-700 border border-rose-200/60 font-bold animate-alert-pulse",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold ${styles[risk]}`}>{risk}</span>;
};

export const ApprovalStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Pending: "bg-blue-50 text-blue-700 border border-blue-200/60",
    Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    Rejected: "bg-rose-50 text-rose-700 border border-rose-200/60",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold ${styles[status] || "bg-slate-100 border border-slate-200"}`}>{status}</span>;
};
