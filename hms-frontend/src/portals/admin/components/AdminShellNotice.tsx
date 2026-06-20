import React from 'react';
import { Info } from 'lucide-react';

/**
 * Admin Console notice.
 *
 * Truthful for the current state: some admin areas are live-wired to the
 * HMS backend (user management, branch management, role/permission
 * assignment, audit log review, admin executive). Other areas are still in
 * progress and will be available in a future release. This notice does NOT
 * claim that all admin data is mock-generated — that would be materially
 * false on the live-wired pages that render this component.
 *
 * The page-level badge and footer carry the per-page state.
 */
export const AdminShellNotice: React.FC = () => {
  return (
    <div
      role="status"
      data-testid="admin-shell-notice"
      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
    >
      <div className="p-2 bg-slate-100 rounded-xl">
        <Info className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">
          Admin Console — mixed availability
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
          Some admin areas in this module are live-wired to the HMS backend
          (user management, branch management, role and permission assignment,
          audit log review). Other areas are still in progress and will be
          available in a future release. The page-level badge and footer
          reflect the current state of each specific area.
        </p>
      </div>
    </div>
  );
};

export default AdminShellNotice;
