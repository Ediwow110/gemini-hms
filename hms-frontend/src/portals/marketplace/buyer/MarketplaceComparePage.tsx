import React from 'react';
import { ArrowLeft, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';

export const MarketplaceComparePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Compare Products</h2>
        <p className="text-xs text-slate-500 font-medium">Side-by-side technical comparison</p>
      </div>

      <MarketplaceShellNotice />

      <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
          <Box className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Products Selected</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Select up to 4 products from the catalog to compare.</p>
        </div>
        <button 
          onClick={() => navigate('/marketplace/products')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-200"
        >
          Go to Catalog
        </button>
      </div>
    </div>
  );
};

export default MarketplaceComparePage;
