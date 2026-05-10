import { Badge } from "@/components/ui/badge";

export const UserStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    Invited: "bg-blue-50 text-blue-700 border border-blue-200/60",
    Locked: "bg-rose-50 text-rose-700 border border-rose-200/60",
    Suspended: "bg-amber-50 text-amber-700 border border-amber-200/60",
    Deactivated: "bg-slate-100 text-slate-600 border border-slate-200/60",
  };

  const dotStyles: Record<string, string> = {
    Active: "bg-emerald-500",
    Invited: "bg-blue-500",
    Locked: "bg-rose-500",
    Suspended: "bg-amber-500",
    Deactivated: "bg-slate-400",
  };

  return (
    <Badge className={styles[status] || "bg-slate-100"}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles[status] || "bg-slate-400"}`} />
      {status}
    </Badge>
  );
};

export const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    Admin: "bg-purple-50 text-purple-700 border border-purple-200/60",
    Cashier: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
    "Med-Tech": "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
  };
  return <Badge className={styles[role] || "bg-slate-100"}>{role}</Badge>;
};
