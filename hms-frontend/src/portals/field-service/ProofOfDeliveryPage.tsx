import React from 'react';
import { FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import PhotoEvidencePlaceholder from './components/PhotoEvidencePlaceholder';
import SignatureCapturePlaceholder from './components/SignatureCapturePlaceholder';
import { useFieldServiceProofOfDelivery } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const ProofOfDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: delivery } = useFieldServiceProofOfDelivery();

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        <HmsPageHeader
          title="Proof of Delivery"
          description={`Job: ${delivery?.jobId ?? '...'}`}
          badge="Sandbox"
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-8 shadow-sm">
          <PhotoEvidencePlaceholder />
          <div className="h-px bg-slate-100" />
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received By</p>
            <input type="text" placeholder="Recipient Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none" />
          </div>
          <SignatureCapturePlaceholder />
        </div>

        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto">
          <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl uppercase text-xs flex items-center justify-center gap-2">
            <FileCheck className="h-5 w-5" /> Submit Proof (Shell)
          </button>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ProofOfDeliveryPage;
