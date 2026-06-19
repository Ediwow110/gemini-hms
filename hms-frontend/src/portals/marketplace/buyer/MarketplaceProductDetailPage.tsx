import React from 'react';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Wrench, 
  Box, 
  FileText,
  ShoppingCart,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import ProductSpecTable from './components/ProductSpecTable';

export const MarketplaceProductDetailPage: React.FC = () => {
  const navigate = useNavigate();

  const specs = [
    { label: 'Display', value: '23" High-Resolution OLED Monitor' },
    { label: 'Frequency Range', value: '1 - 18 MHz' },
    { label: 'Imaging Modes', value: '2D, 3D/4D, Doppler, Elastography' },
    { label: 'Probes Supported', value: 'Electronic Matrix 4D' },
    { label: 'Connectivity', value: 'DICOM 3.0, Wi-Fi, Ethernet' },
  ];

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Catalog
      </button>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images Placeholder */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-[2rem] border border-slate-200 flex items-center justify-center text-slate-300 shadow-inner">
            <Box className="h-24 w-24" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 cursor-pointer hover:border-indigo-300 transition-all">
                <Box className="h-6 w-6" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">GE Healthcare · Imaging Systems (Prototype Example)</p>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Voluson E10 BT20 Expert Ultrasound
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-sm font-black text-slate-800 ml-1">5.0</span>
              </div>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-bold uppercase">12 Verified Reviews</span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-xs text-emerald-600 font-black uppercase">In Stock</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Indicative Price (Prototype Data)</p>
              <p className="text-3xl font-black text-slate-900">₱4,250,000</p>
            </div>
            <div className="text-right">
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">Bulk Pricing Available</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">3-Year Warranty</p>
                <p className="text-[10px] text-slate-400 font-medium">Manufacturer backed protection</p>
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Free Installation</p>
                <p className="text-[10px] text-slate-400 font-medium">By certified technician</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <button title="Simulation: Not persisting to real cart" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <ShoppingCart className="h-5 w-5" /> Add to Cart (Shell)
              </button>
              <button title="Simulation: Not submitting real RFQ" className="flex-1 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                <FileText className="h-5 w-5" /> Request Quote (Shell)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Info className="h-3 w-3" /> Actions are simulated in this functional prototype shell
            </p>
          </div>
        </div>
      </div>

      {/* Tabs / Detailed Specs */}
      <div className="pt-12 border-t border-slate-100">
        <div className="flex gap-8 border-b border-slate-100 mb-8 overflow-x-auto">
          {['Technical Specs', 'Supplier Info', 'Manuals & Docs', 'Reviews'].map((tab, i) => (
            <button key={tab} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${i === 0 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Key Technical Specifications (Prototype / Example Values)</h3>
            <ProductSpecTable specs={specs} />
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Facility Readiness Requirements</h3>
            <div className="space-y-4">
              {[
                'Stable 220V Power Supply with UPS backup',
                'Climate-controlled room (20-24°C)',
                'Network access for DICOM integration',
                'Min. floor space: 4sqm for operation'
              ].map((req) => (
                <div key={req} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-medium text-slate-600 leading-relaxed">{req}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-slate-200">
               <div className="flex items-center gap-2 text-indigo-600">
                 <Info className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Site Survey Recommended</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProductDetailPage;
