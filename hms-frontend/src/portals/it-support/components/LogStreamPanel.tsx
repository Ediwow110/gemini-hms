import React, { useState } from 'react';
import { Terminal, Filter, ShieldCheck } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'CRITICAL';
  service: string;
  message: string;
  traceId?: string;
}

interface LogStreamPanelProps {
  logs: LogEntry[];
}

export const LogStreamPanel: React.FC<LogStreamPanelProps> = ({ logs }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const severities = ['all', 'INFO', 'WARN', 'ERROR', 'DEBUG', 'CRITICAL'];
  const services = ['all', ...Array.from(new Set(logs.map(l => l.service)))];

  const filteredLogs = logs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (serviceFilter !== 'all' && log.service !== serviceFilter) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-500 bg-rose-50';
      case 'ERROR':
        return 'text-rose-400 bg-rose-50/50';
      case 'WARN':
        return 'text-amber-500 bg-amber-50/50';
      case 'DEBUG':
        return 'text-slate-400 bg-slate-50';
      default:
        return 'text-blue-500 bg-blue-50/50';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-500" />
            System Log Stream
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Simulated system logs with severity and service filtering</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          {severities.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Severities' : s}</option>
          ))}
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          {services.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Services' : s}</option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400 font-medium ml-auto">{filteredLogs.length} entries</span>
      </div>

      {/* Log Stream */}
      <div className="bg-slate-900 rounded-xl p-4 max-h-[380px] overflow-y-auto font-mono text-[11px] space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-sans">
            <Terminal className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">No logs match current filters</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 py-1 border-b border-slate-800/50 last:border-0">
              <span className="text-slate-500 whitespace-nowrap">{log.timestamp}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getSeverityColor(log.severity)} whitespace-nowrap`}>
                {log.severity.padEnd(8)}
              </span>
              <span className="text-cyan-400 whitespace-nowrap">[{log.service}]</span>
              <span className="text-slate-300 break-all">{log.message}</span>
              {log.traceId && (
                <span className="text-slate-600 whitespace-nowrap ml-auto">trace:{log.traceId}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Security Banner */}
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-[10px] text-indigo-800">
        <ShieldCheck className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Security & Redaction Notice</span>
          All log entries displayed are simulated. In production, sensitive values including secrets, tokens, passwords, and patient identifiers are automatically redacted before rendering. No real system log data is exposed in this view.
        </div>
      </div>
    </div>
  );
};

export default LogStreamPanel;
