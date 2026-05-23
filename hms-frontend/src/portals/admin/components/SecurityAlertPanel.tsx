import React from 'react';
import { ShieldAlert, UserX, LogIn, AlertTriangle, Key } from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'FAILED_LOGIN' | 'MFA_DISABLED' | 'LOCKED_ACCOUNT' | 'SUSPICIOUS_ACCESS';
  title: string;
  description: string;
  time: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

interface SecurityAlertPanelProps {
  alerts: SecurityAlert[];
}

export const SecurityAlertPanel: React.FC<SecurityAlertPanelProps> = ({ alerts }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'FAILED_LOGIN':
        return LogIn;
      case 'LOCKED_ACCOUNT':
        return UserX;
      case 'MFA_DISABLED':
        return Key;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'WARNING':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
          Active Security Alerts
        </h3>
        <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {alerts.length} Incidents
        </span>
      </div>

      <div className="space-y-2.5">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No active threat alerts or suspicious indicators detected.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            return (
              <div 
                key={alert.id} 
                className={`p-3.5 border rounded-xl flex gap-3.5 items-start text-xs transition-all hover:bg-slate-50/50 ${getSeverityStyle(alert.severity)}`}
              >
                <div className={`p-2 rounded-lg border bg-white ${
                  alert.severity === 'CRITICAL' 
                    ? 'text-rose-600 border-rose-100' 
                    : alert.severity === 'WARNING' 
                    ? 'text-amber-600 border-amber-100' 
                    : 'text-indigo-600 border-indigo-100'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-extrabold text-slate-900 leading-none">{alert.title}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
                  </div>
                  <p className="text-slate-500 mt-1 font-medium">{alert.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default SecurityAlertPanel;
