import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useUser, usePermissions } from '../hooks/use-user';
import { roleNavigation, NavItemConfig } from '../config/roleNavigation';
import { getPortalRouteConfig } from '../config/portalRoutes';

interface ActiveItemMatch {
  item: NavItemConfig;
  ancestors: NavItemConfig[];
}

/**
 * Helper to normalize paths by stripping a trailing slash if present (except for root /).
 */
const getItemKey = (item: NavItemConfig): string => `${item.label}::${item.to}`;

const normalizePath = (path: string): string => {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

/**
 * Recursively searches for the best active matching NavItem in the sidebar tree.
 * Matches exact paths first, then falls back to the longest prefix match.
 * Ancestor hierarchy is strictly returned to prevent sibling prefix collisions.
 */
const findBestMatch = (items: NavItemConfig[], targetPath: string): ActiveItemMatch | null => {
  const normalizedTarget = normalizePath(targetPath);
  let bestMatch: ActiveItemMatch | null = null;
  let bestMatchLen = -1;

  const traverse = (currentItems: NavItemConfig[], currentAncestors: NavItemConfig[]) => {
    for (const item of currentItems) {
      const normalizedItemTo = normalizePath(item.to);

      // 1. Exact match
      if (normalizedItemTo === normalizedTarget) {
        bestMatch = { item, ancestors: currentAncestors };
        bestMatchLen = normalizedItemTo.length;
        if (item.children) {
          traverse(item.children, [...currentAncestors, item]);
        }
        continue;
      }

      // 2. Prefix match (with trailing slash boundary check to prevent substring collisions)
      if (normalizedItemTo !== '/' && normalizedTarget.startsWith(normalizedItemTo + '/')) {
        if (normalizedItemTo.length > bestMatchLen) {
          bestMatch = { item, ancestors: currentAncestors };
          bestMatchLen = normalizedItemTo.length;
        }
      }

      if (item.children) {
        traverse(item.children, [...currentAncestors, item]);
      }
    }
  };

  traverse(items, []);
  return bestMatch;
};

interface RoleBasedSidebarProps {
  pathname: string;
  onNavClick?: () => void;
}

export const RoleBasedSidebar = ({ pathname, onNavClick }: RoleBasedSidebarProps) => {
  const user = useUser();
  const { canAccess } = usePermissions();
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(new Set());
  const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<string>>(new Set());

  const isExpanded = (item: NavItemConfig) => {
    const key = getItemKey(item);
    if (manuallyCollapsed.has(key)) return false;
    if (manuallyExpanded.has(key)) return true;
    return Boolean(item.children?.length) && (isActive(item) || hasActiveDescendant(item));
  };

  const handleNavClick = (item: NavItemConfig) => {
    if (item.children?.length) {
      const key = getItemKey(item);
      const expanded = isExpanded(item);

      if (expanded) {
        setManuallyExpanded((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setManuallyCollapsed((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      } else {
        setManuallyCollapsed((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setManuallyExpanded((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    } else {
      onNavClick?.();
    }
  };

  const renderNavItem = (item: NavItemConfig, depth = 0) => {
    const Icon = item.icon;
    const active = isActive(item);
    const expanded = isExpanded(item);
    const hasChildren = Boolean(item.children?.length);

    const navItemContent = (
      <>
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
      </>
    );

    const navItemClassName = `w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
      active
        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
        : expanded
          ? 'bg-slate-50 text-slate-900'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    } ${depth > 0 ? 'ml-4 py-2 text-[12px]' : ''}`;

    return (
      <div key={getItemKey(item)} className="space-y-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => handleNavClick(item)}
            aria-expanded={expanded}
            className={navItemClassName}
          >
            {navItemContent}
          </button>
        ) : (
          <Link
            to={item.to}
            onClick={() => handleNavClick(item)}
            className={navItemClassName}
            aria-current={active ? 'page' : undefined}
          >
            {navItemContent}
          </Link>
        )}

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

      {/* User profile card — display-only.
          Sign-out is handled exclusively by the explicit "Sign out" button in
          the AppShell topbar (with a 2-step confirmation bar). This card must
          NOT trigger logout on click; it is an identity display surface only. */}
      <div className="p-3 border-t border-slate-100 bg-white sticky bottom-0">
        <div
          data-testid="sidebar-user-card"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80"
          title={user?.email || 'Signed in'}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200 uppercase" aria-hidden="true">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.roles?.[0]}</p>
          </div>
        </div>
      </div>
    </>
  );
};
export default RoleBasedSidebar;
