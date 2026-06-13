import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useUser, useAuth, usePermissions } from '../hooks/use-user';
import { roleNavigation, NavItemConfig } from '../config/roleNavigation';

interface RoleBasedSidebarProps {
  pathname: string;
  onNavClick?: () => void;
}

export const RoleBasedSidebar = ({ pathname, onNavClick }: RoleBasedSidebarProps) => {
  const user = useUser();
  const { logout } = useAuth();
  const { canAccess } = usePermissions();
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(new Set());

  const isDemoHidden = (item: NavItemConfig) => {
    if (item.isHiddenForDemo) return true;
    if (item.isComingSoon) return true;
    return false;
  };

  const canView = (item: NavItemConfig) =>
    !isDemoHidden(item) &&
    canAccess({
      permission: item.permission,
      allowedRoles: item.allowedRoles,
      isBranchScoped: item.isBranchScoped,
      zone: item.zone,
    });

  const getAllowedItems = (items: NavItemConfig[]): NavItemConfig[] =>
    items
      .filter(canView)
      .map((item) => ({
        ...item,
        children: item.children ? getAllowedItems(item.children) : undefined,
      }));

  const flattenItems = (items: NavItemConfig[]): NavItemConfig[] =>
    items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);

  const navGroups = roleNavigation
    .map((group) => ({
      ...group,
      items: getAllowedItems(group.items),
    }))
    .filter((group) => group.items.length > 0);

  const allAllowedItems = flattenItems(navGroups.flatMap((group) => group.items));

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

  const isActive = (path: string): boolean => {
    if (bestActiveTo === path) return true;
    if (bestActiveTo && path !== '/' && bestActiveTo.startsWith(path + '/')) return true;
    return false;
  };

  const hasActiveDescendant = (item: NavItemConfig): boolean =>
    item.children?.some((child) => isActive(child.to) || hasActiveDescendant(child)) ?? false;

  const isExpanded = (item: NavItemConfig) => {
    const auto = Boolean(item.children?.length) && (pathname === item.to || pathname.startsWith(`${item.to}/`) || hasActiveDescendant(item));
    if (manuallyExpanded.has(item.to)) return !auto;
    return auto;
  };

  const handleNavClick = (item: NavItemConfig) => {
    if (item.children?.length) {
      setManuallyExpanded(prev => {
        const next = new Set(prev);
        if (next.has(item.to)) next.delete(item.to);
        else next.add(item.to);
        return next;
      });
    }
    onNavClick?.();
  };

  const renderNavItem = (item: NavItemConfig, depth = 0) => {
    const Icon = item.icon;
    const active = isActive(item.to);
    const expanded = isExpanded(item);
    const hasChildren = Boolean(item.children?.length);

    return (
      <div key={item.to} className="space-y-1">
        <Link
          to={item.to}
          onClick={() => handleNavClick(item)}
          role={hasChildren ? 'button' : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
            active
              ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
              : expanded
                ? 'bg-slate-50 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          } ${depth > 0 ? 'ml-4 py-2 text-[12px]' : ''}`}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full animate-fade-in" />
          )}
          <Icon className={`h-[18px] w-[18px] transition-colors duration-200 ${
            active
              ? 'text-indigo-600'
              : expanded
                ? 'text-slate-600'
                : 'text-slate-400 group-hover:text-slate-600'
          }`} />
          <span className="flex-1 min-w-0">{item.label}</span>
          {hasChildren ? (
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          ) : null}
        </Link>

        {hasChildren ? (
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: expanded ? '600px' : '0' }}
          >
            <div className="space-y-1 border-l border-slate-200/80 ml-6 pl-2 pt-1">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => {
          return (
            <div key={group.label} className="animate-fade-in">
              <h3 className="px-3 text-label mb-2 select-none">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => renderNavItem(item))}
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
