import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { LabOrderHeader } from './components/LabOrderHeader';
import { CheckSquare, AlertTriangle, Send, ShieldAlert, FileText, UserCheck } from 'lucide-react';

const mockOrder = {
  id: 'ORD-2026-901',
  patientName: 'Victor Frankenstein',
  patientAge: 38,
  patientGender: 'Male',
  mrn: 'MRN-2026-0810',
  dob: '1988-11-04',
  accessCode: 'LIS-9801',
  physician: 'Dr. John Watson',
  department: 'OPD Clinic A',
  billingStatus: 'Prepaid' as const,
  specimenId: 'SPC-01',
  specimenType: 'Whole Blood',
  container: 'Lavender Top (EDTA)',
  collectedTime: 'Today, 08:45 AM',
  encodedBy: 'Jane Smith, RMT',
  validatedBy: 'Dr. Elizabeth Lavenza, Pathologist'
};

export const ResultReleasePage = () => {
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState({
    identityMatch: false,
    barcodeScanned: false,
    billingCleared: true,
    signatureVerified: false,
  });

  const [criticalAck, setCriticalAck] = useState(false);
  const [signerName, setSignerName] = useState('Dr. Elizabeth Lavenza');

  const hasCriticalsInOrder = true; // Simulated

  const isFormValid = 
    checklist.identityMatch && 
    checklist.barcodeScanned && 
    checklist.billingCleared && 
    checklist.signatureVerified && 
    (!hasCriticalsInOrder || criticalAck) &&
    signerName.trim().length > 0;

  const handleRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    alert(`Audit Log Created: Laboratory results for Order ${mockOrder.id} released. Dispatching notifications and updating patient EMR records.`);
    navigate('/lab');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Diagnostic Dispatch (WIP/Mock)</h5>
          <p className="font-medium mt-0.5">
            The result release workflow is currently running in demo mode. Releasing this assay simulates record dispatch and generates a mock system audit log locally in client state. No persistent EMR changes will be written to the server database.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Diagnostic Dispatch & Release Desk" 
          description="Final releasing workspace. Perform secondary safety checks, apply electronic signature, and dispatch validated results to patient portals and EMR." 
        />
        
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl animate-pulse">
          Release Gate Active
        </div>
      </div>

      {/* Lab Order Header */}
      <LabOrderHeader order={mockOrder} />

      {/* Warning sandbox banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This LIS release console is running in demo mode. Releasing this assay simulates record dispatch and generates a mock system audit log locally in client state. No persistent EMR changes will be written to the server database.
          </p>
        </div>
      </div>

      <form onSubmit={handleRelease} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Checklist & signature */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
              Final Safety Checklist
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-slate-650">
              <label className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.identityMatch}
                  onChange={(e) => setChecklist({ ...checklist, identityMatch: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                />
                <div>
                  <p className="font-black text-slate-800">Verify Patient Identity</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Confirm name and MRN matches requested clinical order sheet.</p>
                </div>
              </label>

              <label className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.barcodeScanned}
                  onChange={(e) => setChecklist({ ...checklist, barcodeScanned: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                />
                <div>
                  <p className="font-black text-slate-800">Barcode / Accession Verification</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Validate scanned tube ID matches encoded analyzer output.</p>
                </div>
              </label>

              <label className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.signatureVerified}
                  onChange={(e) => setChecklist({ ...checklist, signatureVerified: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5" 
                />
                <div>
                  <p className="font-black text-slate-800">Supervisor Signature Validation</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Confirm pathologist or med-tech supervisor signature is appended.</p>
                </div>
              </label>

              <label className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl flex items-start gap-3 cursor-not-allowed select-none">
                <input 
                  type="checkbox" 
                  checked={checklist.billingCleared}
                  disabled
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-not-allowed" 
                />
                <div>
                  <p className="font-black text-emerald-800">Billing Clearance Confirmed</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Order marked as prepaid. No cashier balance holds active.</p>
                </div>
              </label>
            </div>
            
            {/* Critical results warning check */}
            {hasCriticalsInOrder && (
              <div className="p-4.5 bg-rose-50 border border-rose-100 rounded-2xl space-y-3.5">
                <div className="flex gap-2.5 text-xs text-rose-800">
                  <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <h5 className="font-extrabold text-sm text-rose-900">Critical Results Acknowledgment Required</h5>
                    <p className="font-medium mt-0.5">
                      This panel contains critical results (elevated parameters). The supervisor must confirm physician contact details are registered prior to release.
                    </p>
                  </div>
                </div>

                <label className="bg-white border border-rose-200 p-3 rounded-xl flex items-center gap-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={criticalAck}
                    onChange={(e) => setCriticalAck(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-black text-rose-800">
                    I confirm that Dr. John Watson has been notified of the critical values in this report.
                  </span>
                </label>
              </div>
            )}

            {/* Validator signature name */}
            <div className="space-y-2 border-t border-slate-100 pt-5 text-xs">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Electronic Signer / Releasing Officer
              </label>
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-slate-450" />
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="input py-2 px-3.5 text-xs w-full max-w-sm rounded-xl border border-slate-200"
                  placeholder="Enter supervisor full name..."
                  required
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Audit logs & final release action */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Dispatch Action
            </h3>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full btn py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold shadow-sm transition-all ${
                isFormValid 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" /> Approve & Release Results
            </button>

            <div className="p-3 bg-slate-50 border border-slate-150/60 rounded-xl space-y-1.5 text-[11px] text-slate-550 font-semibold leading-relaxed">
              <h5 className="font-bold text-slate-700 flex items-center gap-1">
                <FileText className="h-4 w-4 text-indigo-500" />
                Secure LIS Audit Record
              </h5>
              <p>Releasing this report automatically registers:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Signer identity: {signerName || 'Pending'}</li>
                <li>Timestamped checksum hash</li>
                <li>HIPAA patient access consent</li>
              </ul>
            </div>
          </div>

          <div className="card p-5 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl text-xs text-indigo-800 font-semibold space-y-2">
            <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">Release Authorization Notes</h4>
            <p className="text-[10.5px] leading-relaxed">
              By releasing this document, you certify that quality control procedures were followed and all diagnostic values match primary assay printouts.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResultReleasePage;
