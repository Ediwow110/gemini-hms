import { useCallback, useEffect, useState } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  CreditCard, 
  ShieldAlert, 
  Check, 
  User
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { useAutoDraft } from '../../lib/autodraft/useAutoDraft';
import { DraftRecoveryDialog } from '../../lib/autodraft/DraftRecoveryDialog';
import { deleteAutoDraft } from '../../lib/autodraft/indexedDbDraftStore';
import { useUser } from '../../hooks/use-user';

type AppointmentDraftData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  insuranceProvider: string;
  policyId: string;
  emergencyName: string;
  emergencyPhone: string;
  reason: string;
  referredDept: string;
};

const EMPTY_FORM: AppointmentDraftData = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  insuranceProvider: '',
  policyId: '',
  emergencyName: '',
  emergencyPhone: '',
  reason: '',
  referredDept: '',
};

export const NursePatientIntakePage = () => {
  const currentUser = useUser();
  const currentUserId = currentUser?.id || '';

  const [formData, setFormData] = useState<AppointmentDraftData>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [showRecovery, setShowRecovery] = useState(true);

  useEffect(() => {
    setShowRecovery(true);
  }, []);

  const route = '/nurse/intake';

  const autoDraft = useAutoDraft<AppointmentDraftData>({
    enabled: true,
    userId: currentUserId,
    module: 'appointment',
    entityId: null,
    route,
    formData,
    isDirty,
    ttlHours: 72,
  });

  const { draftId, discardDraft, clearRecoveredDraft } = autoDraft;

  const updateField = useCallback(
    <K extends keyof AppointmentDraftData>(key: K, value: AppointmentDraftData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleResume = useCallback(
    (draftFormData: AppointmentDraftData) => {
      setFormData(draftFormData);
      setIsDirty(true);
      clearRecoveredDraft();
    },
    [clearRecoveredDraft]
  );

  const handleClose = useCallback(() => setShowRecovery(false), []);

  const [isRegistering, setIsRegistering] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      setSuccessMsg(true);
      setIsDirty(false);
      deleteAutoDraft(draftId);
      setFormData(EMPTY_FORM);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Outpatient Intake & Registration" 
        description="Enroll walk-in patients, update insurance claims coverage, verify identities, and dispatch to outpatient clinics." 
      />

      <div className="max-w-4xl mx-auto">
        {successMsg ? (
          <div className="card p-10 bg-emerald-50/20 border border-emerald-100/80 shadow-sm rounded-2xl text-center space-y-4 flex flex-col items-center animate-fade-in">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-black text-emerald-800 text-base">Patient Checked In Successfully</h3>
            <p className="text-xs text-emerald-600 font-semibold max-w-md">
              Demographic records have been registered, and the patient has been routed to the triage queues.
            </p>
            <button 
              onClick={() => setSuccessMsg(false)}
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-6 rounded-xl shadow-sm shadow-emerald-200"
            >
              Start New Registration
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
            {/* Recovery dialog */}
            {showRecovery ? (
              <DraftRecoveryDialog
                draft={autoDraft.recoveredDraft}
                onResume={handleResume}
                onDiscard={discardDraft}
                onClose={handleClose}
                message="Recovered intake draft — this is local browser data, not a saved patient record. Verify all fields before submitting."
              />
            ) : null}

            {/* 1. Demographics Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="h-4 w-4 text-indigo-500" />
                Demographic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="e.g. John"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="e.g. Doe"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biological Sex</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-700"
                  >
                    <option value="">Select gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="e.g. 555-0199"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="e.g. john.doe@example.com"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-col space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Street, City, Zip Code"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* 2. Insurance & Coverage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  HMO & Insurance Coverage
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider / Payer</label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={(e) => updateField('insuranceProvider', e.target.value)}
                      placeholder="e.g. Blue Shield"
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy ID / No.</label>
                    <input
                      type="text"
                      value={formData.policyId}
                      onChange={(e) => updateField('policyId', e.target.value)}
                      placeholder="e.g. BS-909283-A"
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Emergency Contacts */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldAlert className="h-4 w-4 text-indigo-500" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={(e) => updateField('emergencyName', e.target.value)}
                      placeholder="Full Name"
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => updateField('emergencyPhone', e.target.value)}
                      placeholder="Phone Number"
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Visit Reasons */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <UserCheck className="h-4 w-4 text-indigo-500" />
                Visit Routing Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => updateField('reason', e.target.value)}
                    placeholder="Brief description of primary symptoms"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Department</label>
                  <select
                    required
                    value={formData.referredDept}
                    onChange={(e) => updateField('referredDept', e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-700"
                  >
                    <option value="">Select target department...</option>
                    <option value="er">Emergency Department (ER)</option>
                    <option value="opd">General Outpatient Clinic (OPD)</option>
                    <option value="pedia">Pediatric Clinic</option>
                    <option value="cardio">Cardiovascular Center</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isRegistering}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 font-extrabold flex items-center gap-1.5 rounded-xl shadow-md transition-all"
              >
                <UserPlus className="h-4.5 w-4.5" />
                {isRegistering ? 'Registering...' : 'Enroll & Assign Patient'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NursePatientIntakePage;
