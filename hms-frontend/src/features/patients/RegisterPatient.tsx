import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RegisterPatient = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/patients');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 animate-fade-in">
      <PageHeader title="Register New Patient" description="Create a new patient record in the system." />
      
      {/* Step indicator */}
      <div className="flex items-center gap-2 px-1">
        {["Basic Info", "Contact", "Review"].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              i === 0 
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200"
                : "bg-slate-100 text-slate-400"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              {step}
            </div>
            {i < 2 && <div className="w-8 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <SectionCard title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="First Name" required>
              <input className="input" placeholder="e.g. John" />
            </FormField>
            <FormField label="Last Name" required>
              <input className="input" placeholder="e.g. Doe" />
            </FormField>
            <FormField label="Birthdate" required>
              <input type="date" className="input" />
            </FormField>
            <FormField label="Sex" required>
              <select className="input">
                <option value="">Select sex</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </FormField>
          </div>
        </SectionCard>

        <SectionCard title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Phone Number">
              <input className="input" placeholder="e.g. +63 912 345 6789" />
            </FormField>
            <FormField label="Email Address">
              <input className="input" type="email" placeholder="name@example.com" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Home Address">
                <textarea className="input min-h-[100px] py-3" placeholder="Full residential address" />
              </FormField>
            </div>
          </div>
        </SectionCard>
        
        <div className="flex justify-between items-center pt-4">
          <button type="button" onClick={() => navigate('/patients')} className="btn btn-secondary text-slate-500 flex items-center gap-2 px-5 py-2.5">
            <X className="h-4 w-4" />
            Cancel
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/patients')} className="btn btn-secondary flex items-center gap-2 px-5 py-2.5">
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button type="submit" className="btn btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md shadow-indigo-200">
              <Save className="h-4 w-4" />
              Save Patient
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
