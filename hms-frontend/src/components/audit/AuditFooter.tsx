import { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Activity } from 'lucide-react';
import { useUser } from '../../hooks/use-user';

export const AuditFooter = () => {
  const user = useUser();
  const [sessionInfo, setSessionInfo] = useState({
    ipAddress: 'Detecting...',
    sessionId: 'Pending...',
    userAgent: navigator.userAgent,
  });

  useEffect(() => {
    let localSessId = sessionStorage.getItem('hms_session_id');
    if (!localSessId) {
      localSessId = 'sess_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('hms_session_id', localSessId);
    }

    const detectIp = () => {
      setSessionInfo(prev => ({
        ...prev,
        ipAddress: 'Client Connection Gateway',
        sessionId: localSessId!,
      }));
    };

    void detectIp();
  }, []);

  return (
    <footer className="mt-12 py-6 border-t border-slate-200/80 bg-white/80 rounded-t-2xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-semibold text-slate-500 select-none">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100/50">
          <ShieldCheck className="h-4 w-4" />
          <span>Compliance-Oriented Controls</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
          <Lock className="h-4 w-4" />
          <span>Audit Trail Controls</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100/50">
          <Activity className="h-4 w-4" />
          <span>Operational Resilience Target</span>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-1.5">
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          Audited Session Context
        </p>
        <div className="flex flex-wrap md:justify-end gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium font-mono">
          <span>Client IP: <strong className="text-slate-500">{sessionInfo.ipAddress}</strong></span>
          <span>Session ID: <strong className="text-slate-500">{sessionInfo.sessionId.substring(0, 12)}...</strong></span>
          <span>Tenant ID: <strong className="text-slate-500">{user?.tenantId || 'global'}</strong></span>
          <span>Retention Target: <strong className="text-slate-500">Policy-Based</strong></span>
        </div>
        <p className="text-[9px] text-slate-400 font-medium text-left md:text-right max-w-xs leading-normal italic">
          * Warning: Client-reported IP is for reference only and is not trusted for security audit logging. Server-side proxy logs are the authoritative source.
        </p>
      </div>
    </footer>
  );
};
