import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { MetricCard } from '../../components/ui/metric-card';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Sliders, 
  Database,
  CloudOff,
  CloudLightning
} from 'lucide-react';

interface QuoteItem {
  id: string;
  rfqId: string;
  rfqTitle: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  createdAt: string;
  convertedAt: string | null;
  approvedAt: string | null;
}

interface SalesSummaryData {
  conversionRate: number;
  totalEligibleQuotes: number;
  totalConvertedQuotes: number;
  stalledQuotesCount: number;
  quotes: QuoteItem[];
}

export const SalesDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Loading & data states
  const [data, setData] = useState<SalesSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastSynced, setLastSynced] = useState<string | null>(localStorage.getItem('hms_sales_last_synced'));

  // Get parameters from URL
  const paramStartDate = searchParams.get('startDate') || '';
  const paramEndDate = searchParams.get('endDate') || '';
  const paramBranchId = searchParams.get('branchId') || '';

  // Local filter states
  const [startDate, setStartDate] = useState(paramStartDate);
  const [endDate, setEndDate] = useState(paramEndDate);
  const [branchId, setBranchId] = useState(paramBranchId);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Referentially stable filter state for query triggering
  const activeFilters = useMemo(() => ({
    startDate: paramStartDate,
    endDate: paramEndDate,
    branchId: paramBranchId
  }), [paramStartDate, paramEndDate, paramBranchId]);

  // Fetch sales analytics with offline fallback mechanism
  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;
      if (activeFilters.branchId) params.branchId = activeFilters.branchId;

      const response = await apiClient.get<SalesSummaryData>('/v1/analytics/sales/summary', { params });
      
      // Successfully fetched, sync to local cache
      setData(response.data);
      localStorage.setItem('hms_sales_cached_data', JSON.stringify(response.data));
      const syncTime = new Date().toLocaleTimeString();
      localStorage.setItem('hms_sales_last_synced', syncTime);
      setLastSynced(syncTime);
      setIsOffline(false);
    } catch (err) {
      console.warn('Network request failed, attempting local cache lookup:', err);
      
      // Network failure, trigger cache fallback
      const cached = localStorage.getItem('hms_sales_cached_data');
      if (cached) {
        setData(JSON.parse(cached));
        setIsOffline(true);
      } else {
        setError('Unable to fetch sales summary and no local offline data was found.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  // Trigger fetch when dynamic active filters update
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSalesData();
  }, [fetchSalesData]);

  // Debounced/Buffered state submission to the URL router to avoid rendering loop
  const handleApplyFilters = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (startDate) newParams.set('startDate', startDate);
    if (endDate) newParams.set('endDate', endDate);
    if (branchId) newParams.set('branchId', branchId);
    setSearchParams(newParams);
  }, [startDate, endDate, branchId, setSearchParams]);

  // Clear filters
  const handleResetFilters = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setBranchId('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Dynamic formatting for total values
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Premium Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 pb-5 space-y-4 md:space-y-0">
        <PageHeader 
          title="B2B Sales Summary" 
          description="Real-time B2B Quote Conversion, Assets, & Pipeline Analytics" 
        />

        {/* Offline / Online System Sync Indicator */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          {isOffline ? (
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
              <CloudOff className="h-4 w-4 animate-pulse" />
              <span>Offline Mode</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
              <CloudLightning className="h-4 w-4" />
              <span>System Connected</span>
            </div>
          )}
          {lastSynced && (
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Synced: {lastSynced}
            </span>
          )}
          <button 
            onClick={fetchSalesData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center min-h-[38px] min-w-[38px]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Analytics Filter Panel */}
      <form onSubmit={handleApplyFilters} className="card p-6 shadow-sm border border-slate-200/80 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-2">
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>Start Date</span>
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 w-full"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>End Date</span>
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 w-full"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="h-3.5 w-3.5 text-indigo-500" />
              <span>Branch Filter</span>
            </label>
            <input 
              type="text" 
              placeholder="Enter Branch UUID..."
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 w-full font-mono placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-end space-x-3">
            <button 
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer text-center"
            >
              Apply Filter
            </button>
            <button 
              type="button"
              onClick={handleResetFilters}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center space-x-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Matrix Dashboard */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          <span className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
            Analyzing Transactions & Pipelines...
          </span>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="animate-slide-up stagger-1">
              <MetricCard 
                title="Quote Conversion Rate" 
                value={`${data.conversionRate.toFixed(2)}%`}
                description="Accepted vs eligible quotes"
                icon={TrendingUp}
                color="indigo"
                trend={{ value: "conversion health", isPositive: data.conversionRate >= 50 }}
              />
            </div>
            <div className="animate-slide-up stagger-2">
              <MetricCard 
                title="Eligible Quotes" 
                value={data.totalEligibleQuotes}
                description="Pipeline quote volume"
                icon={FileText}
                color="slate"
              />
            </div>
            <div className="animate-slide-up stagger-3">
              <MetricCard 
                title="Converted Orders" 
                value={data.totalConvertedQuotes}
                description="Handovers with linked sales orders"
                icon={CheckCircle2}
                color="emerald"
              />
            </div>
            <div className="animate-slide-up stagger-4">
              <MetricCard 
                title="Stalled Quotes Alert" 
                value={data.stalledQuotesCount}
                description="Quotes pending > 5 days"
                icon={AlertTriangle}
                color={data.stalledQuotesCount > 0 ? "rose" : "slate"}
              />
            </div>
          </div>

          {/* Drill-down Quotes Pipeline Ledger Table */}
          <div className="card overflow-hidden border border-slate-200/80 bg-white shadow-sm flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Database className="h-4 w-4 text-indigo-500" />
                </div>
                Quotes Pipeline Ledger
                <span className="text-xs font-medium text-slate-400">verification source</span>
              </h3>
              <span className="bg-indigo-55 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-lg font-mono">
                {data.quotes.length} total transaction records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-premium">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/30">
                    <th className="py-4 px-6">Quote ID</th>
                    <th className="py-4 px-6">RFQ Title</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6">Converted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.quotes.length > 0 ? (
                    data.quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer">
                        <td className="py-4 px-6 font-mono text-xs text-indigo-600 font-bold">
                          {quote.id}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {quote.rfqTitle || <span className="text-slate-400 font-normal italic">No RFQ Attached</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            quote.status === 'ACCEPTED' 
                              ? 'bg-emerald-50 text-emerald-700'
                              : quote.status === 'SENT'
                              ? 'bg-indigo-50 text-indigo-700'
                              : quote.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {formatCurrency(quote.totalAmount)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                          {quote.convertedAt 
                            ? new Date(quote.convertedAt).toLocaleDateString()
                            : <span className="text-slate-300">-</span>
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No matching quote transaction logs were found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      ) : null}

    </div>
  );
};
