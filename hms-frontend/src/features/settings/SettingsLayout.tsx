import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";

export const SettingsLayout = ({ children }: { children?: ReactNode }) => (
  <div className="space-y-6 pb-12 animate-fade-in">
    <PageHeader
      title="Organization Settings"
      description="Manage branches, departments, numbering rules, templates, and security policies."
    />
    {children || <Outlet />}
  </div>
);
