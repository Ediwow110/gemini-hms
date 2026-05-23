import React from 'react';
import { Camera, Image } from 'lucide-react';

export const PhotoEvidencePlaceholder: React.FC = () => {
  return (
    <div className="space-y-3">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photo Evidence</p>
       <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
             <Camera className="h-6 w-6" />
             <span className="text-[10px] font-black uppercase">Take Photo</span>
          </div>
          <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
             <Image className="h-6 w-6" />
             <span className="text-[10px] font-black uppercase">Gallery</span>
          </div>
       </div>
    </div>
  );
};

export default PhotoEvidencePlaceholder;
