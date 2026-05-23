import React from 'react';

export const ProductFilterPanel: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filters</h4>
        <button className="text-[10px] text-indigo-600 font-bold uppercase hover:underline">Clear All</button>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</p>
        <div className="space-y-2">
          {['Imaging', 'Laboratory', 'Clinical', 'Consumables'].map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price Range</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
          <span className="text-slate-300">-</span>
          <input type="number" placeholder="Max" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Installation Included</span>
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">In-Stock Only</span>
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        </div>
      </div>
    </div>
  );
};

export default ProductFilterPanel;
