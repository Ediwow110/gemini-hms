import React from 'react';
import { FileCheck, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/use-user';
import { useFieldServiceDeliveryArchives } from '../../hooks/use-field-service';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import PhotoEvidencePlaceholder from './components/PhotoEvidencePlaceholder';
import SignatureCapturePlaceholder from './components/SignatureCapturePlaceholder';
import { useFieldServiceProofOfDelivery } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const ProofOfDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { data: archives } = useFieldServiceDeliveryArchives();
  const { data: delivery } = useFieldServiceProofOfDelivery();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        <HmsPageHeader
          title="Proof of Delivery"
          description={isAdmin ? "Delivery Proof Archives" : `Job: ${delivery?.jobId ?? '...'}`}
          badge={isAdmin ? "Admin" : "Sandbox"}
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Job ID</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Recipient</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Tech</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Location</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archives?.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.user}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.tech}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.location}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};


export default ProofOfDeliveryPage;
