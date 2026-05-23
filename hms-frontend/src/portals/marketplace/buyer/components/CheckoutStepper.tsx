import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { label: 'Review', icon: ShoppingCart },
  { label: 'Delivery', icon: Package },
  { label: 'Approval', icon: Package }, // Reuse icon for shell
  { label: 'Confirm', icon: Package },
];

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between px-4 py-8">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center gap-2 relative flex-1 last:flex-none">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 z-10 ${i <= currentStep ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
            <step.icon className="h-5 w-5" />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${i <= currentStep ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</span>
          {i < steps.length - 1 && <div className={`absolute top-5 left-1/2 w-full h-0.5 ${i < currentStep ? 'bg-indigo-600' : 'bg-slate-100'} -z-0`} />}
        </div>
      ))}
    </div>
  );
};

export default CheckoutStepper;
