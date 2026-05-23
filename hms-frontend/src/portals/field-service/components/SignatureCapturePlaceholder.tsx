import React from 'react';
import { PenTool } from 'lucide-react';

export const SignatureCapturePlaceholder: React.FC = () => {
  return (
    <div className="space-y-3">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
       <div className="aspect-[3/1] bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-300">
          <PenTool className="h-8 w-8" />
          <p className="text-[10px] font-bold uppercase">Sign here (Shell Placeholder)</p>
       </div>
    </div>
  );
};

export default SignatureCapturePlaceholder;
