import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
      <div className="space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-[10px] text-slate-300">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-indigo-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-500 font-bold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
