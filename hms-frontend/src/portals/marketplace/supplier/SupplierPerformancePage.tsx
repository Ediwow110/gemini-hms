import React from 'react';
import SupplierShellNotice from './components/SupplierShellNotice';
import SupplierPerformanceScorecard from './components/SupplierPerformanceScorecard';
import { Star, Quote } from 'lucide-react';

export const SupplierPerformancePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Performance Analytics</h2>
        <p className="text-xs text-slate-500 font-medium">Buyer feedback and operational efficiency metrics</p>
      </div>

      <SupplierShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <SupplierPerformanceScorecard />
           
           <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Buyer Feedback</h3>
              <div className="space-y-6">
                 {[1, 2].map((i) => (
                   <div key={i} className="space-y-3 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px] text-slate-400">MC</div>
                           <div>
                             <p className="text-xs font-black text-slate-800">Metro Central Hospital</p>
                             <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, j) => <Star key={j} className="h-3 w-3 text-amber-400 fill-amber-400" />)}
                             </div>
                           </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">2 Days Ago</span>
                      </div>
                      <div className="relative pl-8">
                         <Quote className="absolute left-0 top-0 h-5 w-5 text-slate-100 rotate-180" />
                         <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                           "Excellent service and the GE console arrived ahead of schedule. The technician Eric was very professional during the on-site calibration."
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-emerald-900 rounded-[2rem] text-white space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest">Growth Opportunities</h4>
              <p className="text-emerald-300 text-[10px] font-medium leading-relaxed">
                Your on-time delivery is at 98%. Maintaining this for 30 more days will qualify you for the "Trusted Express" badge, increasing listing visibility by 15%.
              </p>
              <button className="w-full py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-black">Learn More</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPerformancePage;
