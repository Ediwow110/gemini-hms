import React from 'react';
import { 
  Stethoscope, 
  FlaskConical, 
  Settings, 
  Truck, 
  ShieldCheck, 
  Wrench,
  Activity,
  Box
} from 'lucide-react';

const categories = [
  { name: 'Imaging & Radiology', icon: Activity },
  { name: 'Laboratory Equipment', icon: FlaskConical },
  { name: 'Clinical Diagnostics', icon: Stethoscope },
  { name: 'Facility Management', icon: Settings },
  { name: 'Logistics & Supply', icon: Truck },
  { name: 'Warranty & Support', icon: ShieldCheck },
  { name: 'Field Services', icon: Wrench },
  { name: 'Consumables', icon: Box },
];

export const CategoryNavigation: React.FC = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.name}
          className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl min-w-[120px] hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
            <cat.icon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <span className="text-[10px] font-black text-slate-600 text-center uppercase tracking-tight">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryNavigation;
