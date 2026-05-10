import { AlertTriangle } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  category: string; // e.g. Regular, HMO, Senior
  balance: number;
  birthdate?: string;
  contact?: string;
  allergies?: string[];
  alerts?: string[];
}

export const PatientIdentityHeader = ({ patient }: { patient: Patient }) => {
  const initials = patient.name.split(" ").map(n => n[0]).join("").toUpperCase();
  
  return (
    <div className="card p-5 mb-6 animate-fade-in border-l-4 border-l-indigo-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200/50 flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{patient.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                patient.category === 'HMO' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                patient.category === 'Senior' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                {patient.category}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 font-medium">
              <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[10px] border border-slate-200">{patient.id}</span>
              <span>•</span>
              <span>{patient.age}Y / {patient.gender}</span>
              <span>•</span>
              <span>DOB: {patient.birthdate || 'N/A'}</span>
              <span>•</span>
              <span>{patient.contact || 'No Contact Info'}</span>
            </div>
            
            {((patient.allergies && patient.allergies.length > 0) || (patient.alerts && patient.alerts.length > 0)) && (
              <div className="flex items-center gap-2 mt-2">
                {patient.allergies?.map(allergy => (
                  <span key={allergy} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold uppercase tracking-wider border border-rose-200/60">
                    <AlertTriangle className="h-3 w-3" /> Allergy: {allergy}
                  </span>
                ))}
                {patient.alerts?.map(alert => (
                  <span key={alert} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-200/60">
                    <AlertTriangle className="h-3 w-3" /> {alert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-left md:text-right p-3 md:p-0 bg-slate-50 md:bg-transparent rounded-lg border md:border-none border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Balance</p>
          <p className={`text-2xl font-extrabold mt-0.5 ${patient.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            ₱{patient.balance.toFixed(2)}
          </p>
          {patient.balance === 0 && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Cleared</p>
          )}
        </div>
      </div>
    </div>
  );
};
