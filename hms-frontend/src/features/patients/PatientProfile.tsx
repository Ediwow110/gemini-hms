import React from "react";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowLeft } from "lucide-react";

export const PatientProfile = () => {
  const navigate = useNavigate();
  const patient = { id: "P001", name: "John Doe", age: 45, gender: "M", category: "Regular", balance: 50 };
  const [activeTab, setActiveTab] = React.useState("Overview");
  
  const tabs = ["Overview", "Orders", "Billing", "Lab Results", "Documents", "Timeline"];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <PatientIdentityHeader patient={patient} />
        </div>
        <div className="flex gap-3 ml-4 mt-2">
          <button onClick={() => navigate('/patients')} className="btn btn-secondary flex items-center gap-2 px-5 py-2.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={() => navigate('/orders/new')} className="btn btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md shadow-indigo-200">
            <PlusCircle className="h-4 w-4" /> Create Order
          </button>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <nav className="flex space-x-1 px-4 pt-1 border-b border-slate-200 overflow-x-auto">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 px-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 relative rounded-t-lg ${
                activeTab === tab 
                  ? "text-indigo-600 bg-indigo-50/50" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-6">
          {activeTab === "Overview" ? (
            <div className="space-y-8 animate-fade-in">
              <section>
                <h3 className="text-base font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Demographics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1 p-4 bg-slate-50/80 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                     <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                   </div>
                   <div className="space-y-1 p-4 bg-slate-50/80 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Gender</p>
                     <p className="text-sm font-semibold text-slate-900">{patient.age}Y / {patient.gender}</p>
                   </div>
                   <div className="space-y-1 p-4 bg-slate-50/80 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                     <p className="text-sm font-semibold text-slate-900">{patient.category}</p>
                   </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              <section>
                <h3 className="text-base font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1 p-4 bg-slate-50/80 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                     <p className="text-sm text-slate-500 italic">Not provided</p>
                   </div>
                   <div className="space-y-1 p-4 bg-slate-50/80 rounded-xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                     <p className="text-sm text-slate-500 italic">Not provided</p>
                   </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="py-16 text-center animate-fade-in">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-lg">📋</span>
              </div>
              <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} data available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Data will appear here once records are created.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
