import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Stethoscope, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';

export const DoctorQueuePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: queue, isLoading, error } = useClinicalWorkQueue();

  const filteredQueue = (queue || []).filter(item => 
    (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.queueNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    const isForbidden = axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {isForbidden 
            ? 'You do not have permission to view the clinical queue. Please contact your administrator.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading work queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Clinical Worklist Queue" 
        description="Review triage logs and manage active clinical examinations." 
      />

      {/* Queue Filter bar */}
      <div className="card p-4 bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search queue by patient name or queue code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Queue Code</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Reason for Visit</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-center">Triage</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-semibold">
                  No patients match search terms or active queue is empty.
                </td>
              </tr>
            ) : (
              filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {item.queueNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{item.patientName || '[REDACTED]'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Registered {item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {item.serviceType}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        item.category === 'EMERGENCY'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : item.category === 'PRIORITY'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                        item.status === 'SERVING'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {item.status === 'SERVING' ? (
                          <>
                            <Stethoscope className="h-3 w-3 animate-pulse" />
                            EXAMINING
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            {item.status}
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/doctor/emr?patientId=${item.patientId}`)}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-indigo-100 text-[11px]"
                    >
                      Open EMR
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default DoctorQueuePage;
