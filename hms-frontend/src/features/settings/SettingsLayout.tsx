import { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import {
  Building2, Layers, Stethoscope, Hash,
  FileText, Bell, Shield,
} from "lucide-react";

const navItems = [
  { to: "/settings/branches", label: "Branches", icon: Building2 },
  { to: "/settings/departments", label: "Departments", icon: Layers },
  { to: "/settings/services", label: "Services & Packages", icon: Stethoscope },
  { to: "/settings/numbering", label: "Numbering Rules", icon: Hash },
  { to: "/settings/templates", label: "Print Templates", icon: FileText },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/settings/security", label: "Security", icon: Shield },
];

export const SettingsLayout = ({ children }: { children?: ReactNode }) => (
  <div className="space-y-6 pb-12 animate-fade-in">
    <PageHeader
      title="System Settings"
      description="Manage branches, departments, numbering rules, templates, and security policies."
    />
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Sidebar */}
      <nav className="lg:col-span-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <div className="lg:col-span-4">
        {children || <Outlet />}
      </div>
    </div>
  </div>
);
