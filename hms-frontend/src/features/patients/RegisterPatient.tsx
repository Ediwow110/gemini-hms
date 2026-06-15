import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/api";
import axios from 'axios';

export const RegisterPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    contactNumber: "",
    email: "",
    address: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.dob) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/v1/patients', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        contactNumber: formData.contactNumber,
        address: formData.address,
        gender: formData.gender,
      });
      navigate('/patients');
    } catch (err) {
      const axiosError = err as axios.AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Failed to register patient. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              <input 
                className="input" 
                placeholder="e.g. John" 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                aria-label="First Name"
              />
            </FormField>
            <FormField label="Last Name" required>
              <input 
                className="input" 
                placeholder="e.g. Doe" 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                aria-label="Last Name"
              />
            </FormField>
            <FormField label="Birthdate" required>
              <input 
                type="date" 
                className="input" 
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                aria-label="Birthdate"
              />
            </FormField>
            <FormField label="Sex" required>
              <select 
                className="input" 
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                aria-label="Sex"
              >
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
              <input 
                className="input" 
                placeholder="e.g. +63 912 345 6789" 
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
              />
            </FormField>
            <FormField label="Email Address">
              <input 
                className="input" 
                type="email" 
                placeholder="name@example.com" 
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Home Address">
                <textarea 
                  className="input min-h-[100px] py-3" 
                  placeholder="Full residential address" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
          </div>
        </SectionCard>
        
        <div className="flex justify-between items-center pt-4">
          <button type="button" onClick={() => navigate('/patients')} className="btn btn-secondary text-slate-500 flex items-center gap-2 px-5 py-2.5">
            <X className="h-4 w-4" />
            Cancel
          </button>
          <div className="flex flex-col items-end gap-3">
            {error && (
              <div className="text-rose-500 text-xs font-semibold animate-shake">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/patients')} className="btn btn-secondary flex items-center gap-2 px-5 py-2.5">
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md shadow-indigo-200 disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
