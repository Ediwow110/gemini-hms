import { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleNavigation } from '../config/roleNavigation';
import { useUser, usePermissions } from '../hooks/use-user';
import type { NavItemConfig } from '../config/roleNavigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { canAccess, isSuperAdmin } = usePermissions();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flattenItems = (items: NavItemConfig[]): NavItemConfig[] =>
    items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);

  // Flatten all navigation items that the user has permission to view
  const allowedItems = roleNavigation
    .flatMap((group) => flattenItems(group.items))
    .filter((item) => {
      if (item.isHiddenForDemo) return false;
      if (item.isComingSoon) return false;
      if (isSuperAdmin && !user?.branchId && item.isBranchScoped) return false;

      return canAccess({
        permission: item.permission,
        allowedRoles: item.allowedRoles,
        isBranchScoped: item.isBranchScoped,
        zone: item.zone,
      });
    })
    .filter((item, index, self) =>
      self.findIndex((t) => t.to === item.to) === index
    );

  const filteredItems = query === ''
    ? allowedItems
    : allowedItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.to.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      // Defer state updates to avoid React's synchronous state update warnings
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].to);
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-auto max-w-xl rounded-2xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-slate-200 ring-1 ring-black/5 overflow-hidden animate-scale-in flex flex-col">
        {/* Search Input */}
        <div className="relative flex items-center border-b border-slate-100 p-4">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a portal name or command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-0 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-sm font-semibold h-9"
          />
          <button 
            onClick={onClose}
            className="text-micro bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <ShieldAlert className="h-8 w-8 text-rose-500 mb-2 animate-bounce-subtle" />
              <p className="text-sm font-semibold text-slate-700">No portals found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching for other keywords, or request permission upgrades.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      onClose();
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">{item.to}</span>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-indigo-600 animate-slide-in-right" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard instructions footer */}
        <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex justify-between text-micro text-slate-500 font-semibold">
          <span>Use <kbd className="bg-white border px-1 rounded shadow-sm">↓</kbd> <kbd className="bg-white border px-1 rounded shadow-sm">↑</kbd> to navigate</span>
          <span>Press <kbd className="bg-white border px-1 rounded shadow-sm">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
};
