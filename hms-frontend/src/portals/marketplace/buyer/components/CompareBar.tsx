import React from 'react';
import { Box, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompareBarProps {
  selectedCount: number;
  onClear: () => void;
}

export const CompareBar: React.FC<CompareBarProps> = ({ selectedCount, onClear }) => {
  const navigate = useNavigate();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center gap-8 shadow-2xl shadow-slate-900/40 border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">{selectedCount} Products Selected</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Technical Comparison</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <div className="flex items-center gap-4">
          <button 
            onClick={onClear}
            className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
          <button 
            onClick={() => navigate('/marketplace/compare')}
            className="bg-white text-slate-900 px-5 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2 group"
          >
            Compare Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
