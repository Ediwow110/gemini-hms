import React from 'react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import FieldServiceScopeFilter from './components/FieldServiceScopeFilter';
import TechnicianJobCard from './components/TechnicianJobCard';
import RouteSummaryPanel from './components/RouteSummaryPanel';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';

export const FieldServiceDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Field Service Dashboard</h2>
          <p className="text-xs text-slate-500 font-medium">Logistics monitoring and field technician operations</p>
        </div>
        <div className="flex items-center gap-3">
          <FieldServiceScopeFilter />
          <button 
            onClick={() => navigate('/field-service/schedule')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md"
          >
            My Schedule
          </button>
        </div>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jobs Today</p>
            <p className="text-3xl font-black text-slate-900">08</p>
         </div>
         <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</p>
            <p className="text-3xl font-black text-indigo-600">02</p>
         </div>
         <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-black text-emerald-600">05</p>
         </div>
         <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 hover:shadow-md transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed/Late</p>
            <p className="text-3xl font-black text-rose-600">01</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Upcoming Job Queue</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TechnicianJobCard 
                id="DEL-9918" 
                type="DELIVERY" 
                customer="Metro Central Hospital" 
                address="Radiology Dept, Quezon City" 
                time="14:30 - 15:30" 
                status="IN_PROGRESS"
                onAction={() => navigate('/field-service/deliveries')}
              />
              <TechnicianJobCard 
                id="INS-0042" 
                type="INSTALLATION" 
                customer="Metro Central Hospital" 
                address="Radiology Dept, Quezon City" 
                time="15:30 - 18:00" 
                status="PENDING"
                onAction={() => navigate('/field-service/installations')}
              />
           </div>
        </div>

        <div className="space-y-8">
           <RouteSummaryPanel />
           <OfflineSyncStatusCard />
        </div>
      </div>
    </div>
  );
};

export default FieldServiceDashboard;
