import React from 'react';
import { Bell, Eye, ChevronRight } from 'lucide-react';

import { useIntegrationNotifications } from '../../../hooks/use-integration';

const severityBadge = (s: string) => {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-rose-50 text-rose-700',
    HIGH: 'bg-amber-50 text-amber-700',
    NORMAL: 'bg-blue-50 text-blue-700',
    LOW: 'bg-slate-50 text-slate-500',
  };
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${colors[s] || colors.NORMAL}`}>{s}</span>;
};

const statusIcon = (s: string) => {
  if (s === 'READ') return <Eye className="h-3.5 w-3.5 text-slate-400" />;
  return <Bell className="h-3.5 w-3.5 text-indigo-500" />;
};



export const NotificationInbox: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = React.useState('');
  const { data: notifications, isLoading, error } = useIntegrationNotifications();

  const filtered = (notifications || []).filter((n) => {
    if (filterSeverity && n.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-500" />
          Notification Inbox
        </h3>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">Loading notifications...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm font-bold text-rose-500">
          {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
            ? 'Unauthorized to view notifications.' 
            : 'Failed to load notifications.'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">No notifications found.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((n) => (
            <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                  n.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  n.severity === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {statusIcon(n.status)}
                    <h4 className={`text-sm ${n.status === 'READ' ? 'font-medium text-slate-500' : 'font-black text-slate-800'}`}>
                      {n.title} 
                      {n.isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{n.id} · {n.sourceDomain} · {new Date(n.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {severityBadge(n.severity)}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                  n.status === 'UNREAD' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {n.status}
                </span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase">Open Record (Shell)</button>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationInbox;
