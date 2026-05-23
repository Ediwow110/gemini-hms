import React from 'react';
import { Search, PlusCircle, Briefcase, Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser, usePermissions } from '../hooks/use-user';

interface TopBarProps {
  onMenuToggle: () => void;
  onSearchClick: () => void;
  onQuickActionClick: () => void;
}

export const TopBar = ({ onMenuToggle, onSearchClick, onQuickActionClick }: TopBarProps) => {
  const user = useUser();
  const { isStaff } = usePermissions();

  // Listen to Cmd+K or Ctrl+K to trigger search palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchClick]);

  return (
    <header className="h-16 topbar-glass flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>

        {/* Search */}
        <div 
          onClick={onSearchClick}
          className="relative hidden md:block max-w-sm w-full cursor-pointer group"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <div className="w-full pl-10 pr-4 py-2 bg-slate-50/85 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl text-sm text-slate-400 font-semibold flex items-center justify-between transition-all select-none">
            <span>Search portals, records...</span>
            <kbd className="hidden sm:inline-block bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-400 font-mono shadow-sm">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Create - Staff Only */}
        {isStaff() && (
          <button 
            onClick={onQuickActionClick} 
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Quick Create</span>
          </button>
        )}

        {/* Branch selector */}
        <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
          <Briefcase className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-xs">Branch: {user?.branchId || 'None'}</span>
        </button>
        
        {/* Notifications */}
        <Link to="/notifications" className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
          </span>
        </Link>

        <div className="h-7 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User profile details */}
        <div className="flex items-center gap-3 pl-1 cursor-pointer group select-none">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-indigo-700 transition-colors truncate max-w-[150px]">{user?.email}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">{user?.roles?.[0]}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-200/50 group-hover:shadow-lg group-hover:shadow-indigo-300/50 transition-all duration-200 uppercase">
            {user?.email?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
export default TopBar;
