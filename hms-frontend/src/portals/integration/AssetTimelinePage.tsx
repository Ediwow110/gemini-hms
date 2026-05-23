import React, { useState } from 'react';
import { ShoppingCart, Truck, Wrench, ShieldCheck, AlertTriangle, PackageSearch } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import AssetTimelineEvent from './components/AssetTimelineEvent';
import { useIntegrationAssetTimeline } from '../../hooks/use-integration';

export const AssetTimelinePage: React.FC = () => {
  const [assetId, setAssetId] = useState('EQP-001'); // Default mock ID
  const { data: events, isLoading, error } = useIntegrationAssetTimeline(assetId);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Asset Timeline</h2>
          <p className="text-xs text-slate-500 font-medium">Cross-domain equipment lifecycle tracking (shell)</p>
        </div>
      </div>

      <IntegrationShellNotice />

      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4">
        <PackageSearch className="h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Select asset/equipment (shell placeholder)..." 
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" 
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-2">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Asset Timeline Events</h3>
        
        {isLoading && assetId ? (
          <div className="p-10 text-center text-sm font-medium text-slate-500">Loading asset timeline...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm font-bold text-rose-500">
            {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
              ? 'Unauthorized to view asset timeline.' 
              : 'Failed to load asset timeline.'}
          </div>
        ) : assetId && (!events || events.length === 0) ? (
          <div className="p-10 text-center text-sm font-medium text-slate-500">No events found for asset.</div>
        ) : (
          events?.map((e) => (
            <AssetTimelineEvent 
              key={e.id}
              type={e.eventType} 
              title={e.title} 
              timestamp={new Date(e.timestamp).toLocaleString()} 
              details={e.summary} 
              icon={e.eventType === 'QUOTE' ? ShoppingCart : e.eventType === 'ORDER' ? PackageSearch : e.eventType === 'DELIVERY' ? Truck : e.eventType === 'INSTALLATION' || e.eventType === 'MAINTENANCE' ? Wrench : ShieldCheck} 
              color={e.eventType === 'QUOTE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : e.eventType === 'ORDER' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : e.eventType === 'DELIVERY' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-violet-50 text-violet-600 border-violet-100'} 
              isMock={e.isMock}
            />
          ))
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">No Real Aggregation</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Asset timeline events are UI placeholders. No real cross-domain aggregation, scheduling, or warranty activation is performed in this phase.</p>
        </div>
      </div>
    </div>
  );
};

export default AssetTimelinePage;
