import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ReasonModal } from "../../components/ui/approval-modals";
import { MetricCard } from "../../components/ui/metric-card";
import { Download, TrendingUp, CheckCircle2, Clock, Package, History, FileText, Loader2, RefreshCw } from "lucide-react";
import { reportService, ReportExport } from "../../services/report.service";

const REPORT_TYPES = [
  { id: 'AUDIT_EVENTS_SUMMARY', name: 'Audit Events Summary', desc: 'Complete history of system mutations and access logs.' },
  { id: 'CASHIER_REVERSAL_RECONCILIATION', name: 'Cashier Reversal Reconciliation', desc: 'Detailed log of all refunds and payment voids.' },
];

export const Reports = () => {
  const [history, setHistory] = useState<ReportExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch export history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExport = async (reason: string) => {
    setIsProcessing(true);
    try {
      await reportService.createExport(selectedType, reason);
      await fetchHistory();
      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate export. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (id: string, type: string) => {
    try {
      await reportService.downloadExport(id, `${type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. It may have been removed from storage.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="animate-fade-in flex justify-between items-center">
        <PageHeader title="Reports & Analytics" description="Monitor financial, clinical, and operational performance." />
        <button 
          onClick={fetchHistory} 
          disabled={isLoading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="animate-slide-up stagger-1">
          <MetricCard title="Sales" value="₱42,250" icon={TrendingUp} color="emerald" />
        </div>
        <div className="animate-slide-up stagger-2">
          <MetricCard title="Payments" value="₱31,100" icon={CheckCircle2} color="indigo" />
        </div>
        <div className="animate-slide-up stagger-3">
          <MetricCard title="Pending Lab" value="8" icon={Clock} color="rose" />
        </div>
        <div className="animate-slide-up stagger-4">
          <MetricCard title="Stock Items" value="120" icon={Package} color="amber" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in stagger-4">
        <div className="card p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
             </div>
             <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Available Exports</h2>
          </div>
          
          <div className="space-y-3 flex-1">
            {REPORT_TYPES.map(type => (
              <div 
                key={type.id} 
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                  selectedType === type.id ? 'bg-indigo-50/50 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className={`font-bold text-sm ${selectedType === type.id ? 'text-indigo-900' : 'text-slate-900'}`}>{type.name}</p>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedType === type.id ? 'border-indigo-500' : 'border-slate-300'
                  }`}>
                    {selectedType === type.id && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button 
              onClick={() => setShowExportModal(true)} 
              disabled={isProcessing}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isProcessing ? 'Generating...' : 'Generate CSV Export'}
            </button>
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col h-full">
           <div className="p-6 border-b border-slate-100 flex items-center gap-2">
             <div className="p-2 bg-amber-50 rounded-lg">
                <History className="h-5 w-5 text-amber-600" />
             </div>
             <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Export History</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto max-h-[400px]">
             {isLoading ? (
               <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                 <Loader2 className="h-6 w-6 animate-spin mb-2" />
                 <p className="text-xs font-medium">Fetching history...</p>
               </div>
             ) : history.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-10">
                 <p className="text-xs font-medium">No previous exports found for your branch.</p>
               </div>
             ) : (
               <table className="w-full text-left text-xs">
                 <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                   <tr>
                     <th className="px-4 py-3">Report</th>
                     <th className="px-4 py-3">Date</th>
                     <th className="px-4 py-3 text-center">Rows</th>
                     <th className="px-4 py-3 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {history.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                       <td className="px-4 py-4">
                         <p className="font-semibold text-slate-900">{item.reportType.split('_').slice(0, 2).join(' ')}...</p>
                         <p className="text-[10px] text-slate-400 truncate max-w-[120px]" title={item.reason}>{item.reason}</p>
                       </td>
                       <td className="px-4 py-4 text-slate-500 font-medium">
                         {new Date(item.createdAt).toLocaleDateString()}
                       </td>
                       <td className="px-4 py-4 text-center">
                         <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{item.rowCount}</span>
                       </td>
                       <td className="px-4 py-4 text-right">
                         {item.status === 'COMPLETED' ? (
                           <button 
                             onClick={() => handleDownload(item.id, item.reportType)}
                             className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 ml-auto"
                           >
                             <Download className="h-3 w-3" /> Download
                           </button>
                         ) : (
                           <span className="text-amber-500 font-bold italic">{item.status}</span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
        </div>
      </div>

      <ReasonModal 
        isOpen={showExportModal} 
        title="Authorize Export" 
        guidance="Please provide a mandatory reason for this data export. This will be logged for security auditing." 
        onConfirm={handleExport} 
        onClose={() => setShowExportModal(false)} 
      />
    </div>
  );
};
