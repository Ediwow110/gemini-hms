import React from 'react';
import { Link2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface IntegrationItem {
  id: string;
  name: string;
  protocol: 'HL7' | 'FHIR' | 'REST' | 'DICOM' | 'SOAP' | 'WEBHOOK';
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  lastSync: string;
  errorCount: number;
  description: string;
  endpoint: string;
}

interface IntegrationStatusCardProps {
  integrations: IntegrationItem[];
}

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({ integrations }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'SYNCING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getProtocolBadge = (protocol: string) => {
    switch (protocol) {
      case 'HL7':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FHIR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DICOM':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'WEBHOOK':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'INBOUND': return '← IN';
      case 'OUTBOUND': return 'OUT →';
      default: return '↔ BI';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-500" />
            System Integrations
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">External system adapters, HL7/FHIR endpoints, and webhook connections</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200">
            {integrations.filter(i => i.status === 'CONNECTED').length} connected
          </span>
          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg border border-rose-200">
            {integrations.filter(i => i.status === 'ERROR').length} errors
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {integrations.map((integration) => (
          <div key={integration.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2.5">
                {getStatusIcon(integration.status)}
                <div>
                  <p className="text-xs font-bold text-slate-800">{integration.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{integration.description}</p>
                </div>
              </div>
              <StatusBadge
                status={integration.status}
                type={integration.status === 'CONNECTED' ? 'success' : integration.status === 'ERROR' ? 'danger' : integration.status === 'SYNCING' ? 'info' : 'pending'}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${getProtocolBadge(integration.protocol)}`}>
                {integration.protocol}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-md text-slate-500">
                {getDirectionLabel(integration.direction)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{integration.endpoint}</span>
            </div>

            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
              <span className="text-slate-400 font-medium">Last sync: {integration.lastSync}</span>
              {integration.errorCount > 0 && (
                <span className="text-rose-600 font-bold">{integration.errorCount} error(s) in 24h</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Notice:</strong> Integration status and sync data are simulated. No real HL7/FHIR messages, webhooks, or API calls are triggered from this view.
      </div>
    </div>
  );
};

export default IntegrationStatusCard;
