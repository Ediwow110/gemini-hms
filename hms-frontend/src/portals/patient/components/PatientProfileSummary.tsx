import React from 'react';
import { UserCircle, Mail, Phone, MapPin, ShieldCheck, CreditCard } from 'lucide-react';

export interface PatientProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
  insuranceProvider: string;
  bloodType: string;
}

interface PatientProfileSummaryProps {
  profile: PatientProfile;
}

export const PatientProfileSummary: React.FC<PatientProfileSummaryProps> = ({ profile }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center border-b border-slate-100 pb-6">
        <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
          <UserCircle className="h-10 w-10" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">{profile.fullName}</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Patient ID: {profile.id}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 flex items-center gap-1">
              DOB: {profile.dateOfBirth}
            </span>
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 flex items-center gap-1">
              Blood Type: {profile.bloodType}
            </span>
          </div>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 px-6 rounded-xl text-xs transition-all shadow-md cursor-pointer">
          Update Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">{profile.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">{profile.address}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Healthcare Details</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Insurance: {profile.insuranceProvider}</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">HMO Plan: Comprehensive Care</span>
            </div>
            <div className="flex items-center gap-3 text-rose-600 font-bold">
              <UserCircle className="h-4 w-4" />
              <span className="text-xs">Emergency: {profile.emergencyContact}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
        <strong>Privacy Notice:</strong> Profile updates are simulated. No real patient master data is modified in this phase.
      </div>
    </div>
  );
};

export default PatientProfileSummary;
