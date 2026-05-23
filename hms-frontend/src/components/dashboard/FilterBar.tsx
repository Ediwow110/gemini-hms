import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdown {
  name: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  dropdowns?: FilterDropdown[];
  onReset?: () => void;
  rightAction?: React.ReactNode;
}

export const FilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  dropdowns = [],
  onReset,
  rightAction,
}: FilterBarProps) => {
  return (
    <div className="card p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-6 animate-fade-in bg-white/70 backdrop-blur-sm shadow-sm border-slate-200/60">
      <div className="flex flex-col sm:flex-row flex-1 gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-10"
          />
        </div>

        {/* Dropdowns */}
        {dropdowns.map((dropdown) => (
          <div key={dropdown.name} className="relative min-w-[140px]">
            <select
              value={dropdown.selectedValue}
              onChange={(e) => dropdown.onChange(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
            >
              <option value="">All {dropdown.label}</option>
              {dropdown.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        ))}

        {/* Reset */}
        {onReset && (
          <button
            onClick={onReset}
            className="btn btn-secondary h-11 px-4 gap-2 text-xs uppercase tracking-wider"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side actions */}
      {rightAction && (
        <div className="flex items-center gap-3 self-end lg:self-center">
          {rightAction}
        </div>
      )}
    </div>
  );
};
