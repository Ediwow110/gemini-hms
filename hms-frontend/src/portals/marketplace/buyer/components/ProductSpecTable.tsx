import React from 'react';

interface Spec {
  label: string;
  value: string;
}

interface ProductSpecTableProps {
  specs: Spec[];
}

export const ProductSpecTable: React.FC<ProductSpecTableProps> = ({ specs }) => {
  return (
    <div className="divide-y divide-slate-100">
      {specs.map((spec) => (
        <div key={spec.label} className="py-3 flex justify-between gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{spec.label}</span>
          <span className="text-xs font-black text-slate-700 text-right">{spec.value}</span>
        </div>
      ))}
    </div>
  );
};

export default ProductSpecTable;
