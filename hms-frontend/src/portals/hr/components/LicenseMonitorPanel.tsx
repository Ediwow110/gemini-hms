import React from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

export interface License {
  id: string;
  employeeName: string;
  type: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED';
}

interface LicenseMonitorPanelProps {
  licenses: License[];
}

export const LicenseMonitorPanel: React.FC<LicenseMonitorPanelProps> = ({ licenses }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            License & Cert Monitor
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Tracking compliance for clinical staff</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
      </div>

      <div className="space-y-3">
        {licenses.map((license) => (
          <div key={license.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                license.status === 'VALID' ? 'bg-emerald-100 text-emerald-600' : 
                license.status === 'EXPIRING' ? 'bg-amber-100 text-amber-600' : 
                'bg-rose-100 text-rose-600'
              }`}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{license.employeeName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{license.type}</p>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-[10px] font-bold ${
                license.status === 'VALID' ? 'text-emerald-600' : 
                license.status === 'EXPIRING' ? 'text-amber-600' : 
                'text-rose-600'
              }`}>
                {license.daysRemaining} days left
              </p>
              <button className="text-[9px] text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-0.5 ml-auto mt-0.5 cursor-pointer transition-colors">
                Verify <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <p className="text-[10px] text-indigo-800 font-medium leading-relaxed">
          The system monitors PRC licenses, BLS/ACLS certifications, and specialized medical board credentials. Alerts are triggered 90 days before expiry.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> License verification is mock-only. No real external API calls are made to licensing boards.
      </div>
    </div>
  );
};
