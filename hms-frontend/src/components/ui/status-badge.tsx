import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200/60",
    Archived: "bg-slate-100 text-slate-600 border border-slate-200/60",
    Unpaid: "bg-rose-50 text-rose-700 border border-rose-200/60",
    Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  };

  const dotStyles: Record<string, string> = {
    Active: "bg-emerald-500",
    Pending: "bg-amber-500",
    Archived: "bg-slate-400",
    Unpaid: "bg-rose-500",
    Paid: "bg-emerald-500",
  };

  return (
    <Badge className={styles[status] || "bg-slate-100"}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles[status] || "bg-slate-400"}`} />
      {status}
    </Badge>
  );
};
