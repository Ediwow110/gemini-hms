import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useUser, useAuth, usePermissions } from '../hooks/use-user';
import { roleNavigation } from '../config/roleNavigation';

interface RoleBasedSidebarProps {
  pathname: string;
  onNavClick?: () => void;
}

export const RoleBasedSidebar = ({ pathname, onNavClick }: RoleBasedSidebarProps) => {
  const user = useUser();
  const { logout } = useAuth();
  const { canAccess } = usePermissions();
  // Flatten all allowed nav items to determine the best match
  const allAllowedItems = roleNavigation.flatMap(group =>
    group.items.filter(item =>
      canAccess({
        permission: item.permission,
        allowedRoles: item.allowedRoles,
        isBranchScoped: item.isBranchScoped,
        zone: item.zone,
      })
    )
  );

  // Find the single best active item (exact match wins first, then longest prefix match)
  let bestActiveTo: string | null = null;
  let longestMatchLength = -1;

  for (const item of allAllowedItems) {
    if (pathname === item.to) {
      bestActiveTo = item.to;
      longestMatchLength = item.to.length;
      break;
    }
  }

  if (!bestActiveTo) {
    for (const item of allAllowedItems) {
      if (item.to !== '/' && pathname.startsWith(item.to + '/')) {
        if (item.to.length > longestMatchLength) {
          longestMatchLength = item.to.length;
          bestActiveTo = item.to;
        }
      }
    }
  }

  if (!bestActiveTo && pathname === '/') {
    bestActiveTo = '/';
  }

  const isActive = (path: string) => {
    return bestActiveTo === path;
  };

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {roleNavigation.map((group) => {
          // Filter items based on user permissions
          const allowedItems = group.items.filter((item) =>
            canAccess({
              permission: item.permission,
              allowedRoles: item.allowedRoles,
              isBranchScoped: item.isBranchScoped,
              zone: item.zone,
            })
          );

          // If no items are allowed in this group, hide the group entirely
          if (allowedItems.length === 0) return null;

          return (
            <div key={group.label} className="animate-fade-in">
              <h3 className="px-3 text-label mb-2 select-none">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {allowedItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
                        active
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full animate-fade-in" />
                      )}
                      <Icon className={`h-[18px] w-[18px] transition-colors duration-200 ${
                        active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile card */}
      <div className="p-3 border-t border-slate-100 bg-white sticky bottom-0">
        <div 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 hover:from-slate-100 hover:to-slate-100 transition-all duration-200 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200 uppercase">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.roles?.[0]}</p>
          </div>
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </>
  );
};
export default RoleBasedSidebar;
