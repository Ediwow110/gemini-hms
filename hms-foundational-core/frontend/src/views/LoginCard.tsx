import React, { useState } from 'react';
import { z } from 'zod';

// Strict Client-Side Boundary Validation Engine
const loginSchema = z.object({
  tenantHandle: z.string().min(3, "Tenant Handle must be at least 3 characters."),
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Passphrase Key must be at least 8 characters.")
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginCard: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({ tenantHandle: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidationAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const validationResult = loginSchema.safeParse(formData);

    if (!validationResult.success) {
      const inlineErrors: Partial<Record<keyof LoginFormData, string>> = {};
      validationResult.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof LoginFormData;
        inlineErrors[key] = issue.message;
      });
      setErrors(inlineErrors);
      setIsSubmitting(false);
      return;
    }

    // Proceed to backend authentication pipeline
    console.log("Validation Passed. Dispatching payload rigidly...", validationResult.data);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-lg overflow-hidden">
        
        {/* Header Block */}
        <div className="bg-[#0F172A] px-6 py-8 text-center">
          <h2 className="text-white text-2xl font-bold tracking-tight">HMS ENCRYPTED PORTAL</h2>
          <p className="text-[#94A3B8] text-sm mt-2">Authorized Clinical Personnel Only</p>
        </div>

        {/* Input Form Matrix */}
        <form onSubmit={handleValidationAndSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1">Organization / Tenant Handle</label>
            <input 
              type="text" 
              className={`w-full px-4 py-2 border ${errors.tenantHandle ? 'border-[#DC2626]' : 'border-[#E2E8F0]'} rounded bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]`}
              placeholder="e.g. st-lukes-medical"
              value={formData.tenantHandle}
              onChange={(e) => setFormData({ ...formData, tenantHandle: e.target.value })}
            />
            {errors.tenantHandle && <span className="text-[#DC2626] text-xs mt-1 block">{errors.tenantHandle}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1">Registered Email</label>
            <input 
              type="email" 
              className={`w-full px-4 py-2 border ${errors.email ? 'border-[#DC2626]' : 'border-[#E2E8F0]'} rounded bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]`}
              placeholder="clinical.staff@hospital.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span className="text-[#DC2626] text-xs mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1">Passphrase Key</label>
            <input 
              type="password" 
              className={`w-full px-4 py-2 border ${errors.password ? 'border-[#DC2626]' : 'border-[#E2E8F0]'} rounded bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && <span className="text-[#DC2626] text-xs mt-1 block">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold py-3 px-4 rounded transition-colors duration-200"
          >
            {isSubmitting ? 'VERIFYING SESSION...' : 'INITIALIZE WORKSPACE'}
          </button>
        </form>
      </div>
    </div>
  );
};
