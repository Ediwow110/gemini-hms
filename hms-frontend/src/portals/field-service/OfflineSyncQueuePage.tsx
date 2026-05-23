import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';

export const OfflineSyncQueuePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Offline Sync Queue</h2>
        <p className="text-xs text-slate-500 font-medium uppercase">3 items awaiting connection</p>
      </div>

      <FieldServiceShellNotice />

      <OfflineSyncStatusCard />

      <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
         <div className="relative z-10 space-y-4">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
               <RefreshCw className="h-5 w-5 animate-spin-slow" />
               Auto-Sync Active
            </h3>
            <p className="text-indigo-300 text-xs font-medium leading-relaxed">
               The system will automatically attempt to upload your local data as soon as a stable internet connection is detected.
            </p>
            <button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
               Retry Sync Now
            </button>
         </div>
      </div>
    </div>
  );
};

export default OfflineSyncQueuePage;
