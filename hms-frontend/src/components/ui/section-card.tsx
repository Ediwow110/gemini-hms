import { ReactNode } from "react";

export const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card p-6 mb-6 animate-fade-in">
    <h3
      className="text-base font-bold text-slate-900 mb-4"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {title}
    </h3>
    {children}
  </div>
);

export const FormField = ({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);
