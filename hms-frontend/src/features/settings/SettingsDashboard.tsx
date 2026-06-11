import { useNavigate } from "react-router-dom";
import {
  Building2, Layers, Stethoscope, Hash,
  FileText, Bell, Shield, AlertTriangle, CheckCircle2,
} from "lucide-react";

const cards = [
  {
    to: "/settings/branches",
    icon: Building2,
    label: "Branches",
    desc: "Manage hospital branches, locations, and operating hours.",
    status: "configured",
  },
  {
    to: "/settings/departments",
    icon: Layers,
    label: "Departments",
    desc: "Define departments and assign them to branches.",
    status: "configured",
  },
  {
    to: "/settings/services",
    icon: Stethoscope,
    label: "Services & Packages",
    desc: "Catalog of medical services, categories, and pricing.",
    status: "needs_review",
  },
  {
    to: "/settings/numbering",
    icon: Hash,
    label: "Numbering Rules",
    desc: "Patient IDs, order numbers, invoice and receipt formats.",
    status: "configured",
  },
  {
    to: "/settings/templates",
    icon: FileText,
    label: "Print Templates",
    desc: "Lab results, receipts, invoices, queue tickets, barcodes.",
    status: "needs_review",
  },
  {
    to: "/settings/notifications",
    icon: Bell,
    label: "Notifications",
    desc: "Email, SMS, in-app notification settings and templates.",
    status: "incomplete",
  },
  {
    to: "/settings/security",
    icon: Shield,
    label: "Security",
    desc: "Session timeout, password policy, MFA, and lockout rules.",
    status: "configured",
  },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "configured":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Configured
        </span>
      );
    case "needs_review":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3" /> Needs Review
        </span>
      );
    case "incomplete":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full animate-alert-pulse">
          <AlertTriangle className="h-3 w-3" /> Incomplete
        </span>
      );
  }
};

export const SettingsDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Critical warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Incomplete Critical Settings</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Notification providers have not been configured. Result-ready notifications will not be dispatched until email/SMS providers are set up.
          </p>
        </div>
      </div>

      {/* Settings cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <button
            key={card.to}
            id={`settings-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => navigate(card.to)}
            className={`card-hover text-left p-6 space-y-3 animate-fade-in cursor-pointer`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <card.icon className="h-5 w-5 text-indigo-600" />
              </div>
              {statusBadge(card.status)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{card.label}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
            </div>
            <p className="text-[11px] text-slate-400">Last updated: —</p>
          </button>
        ))}
      </div>

      {/* Audit notice */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <Shield className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          All settings changes are recorded in the audit log. Sensitive changes (numbering rules, security policies, template versions) require confirmation and a reason before saving.
        </p>
      </div>
    </div>
  );
};
