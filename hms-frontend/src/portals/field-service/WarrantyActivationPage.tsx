import React from 'react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import WarrantyActivationCard from './components/WarrantyActivationCard';

export const WarrantyActivationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Warranty Activation</h2>
        <p className="text-xs text-slate-500 font-medium">Register digital warranty for newly commissioned assets</p>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WarrantyActivationCard />
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-4">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Activation Guide</h4>
           <ul className="space-y-3">
              {[
                'Ensure serial number is visible in photos',
                'Verify handover document is signed by client',
                'Installation report must be uploaded',
                'Warranty period starts from date of commissioning'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs font-medium text-slate-600 leading-relaxed">
                   <span className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                   {tip}
                </li>
              ))}
           </ul>
        </div>
      </div>
    </div>
  );
};

export default WarrantyActivationPage;
