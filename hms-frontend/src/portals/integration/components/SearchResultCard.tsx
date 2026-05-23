import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SearchResultCardProps {
  title: string;
  subtitle: string;
  type: string;
  portal: string;
  icon: LucideIcon;
  isMock?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ title, subtitle, type, portal, icon: Icon, isMock }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">
            {title}
            {isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{type}</span>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600">{portal}</span>
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;
