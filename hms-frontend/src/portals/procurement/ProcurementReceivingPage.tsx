import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { ReceivingMonitorPanel, ReceivingItem } from './components/ReceivingMonitorPanel';
import { ClipboardList } from 'lucide-react';

export const ProcurementReceivingPage: React.FC = () => {
  const mockShipments: ReceivingItem[] = [
    { id: 'REC-001', poNumber: 'PO-2026-441', supplier: 'Apex Medical Corp', expectedDate: 'Today', itemsCount: 15, status: 'PENDING' },
    { id: 'REC-002', poNumber: 'PO-2026-438', supplier: 'Global Pharma Inc', expectedDate: 'Yesterday', itemsCount: 8, status: 'ISSUE' },
    { id: 'REC-003', poNumber: 'PO-2026-430', supplier: 'Metro Lab Tech', expectedDate: 'May 18, 2026', itemsCount: 22, status: 'RECEIVED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Warehouse Receiving Dock
          </h2>
          <p className="text-xs text-slate-500 font-medium">Record incoming shipments, inspect quality, and update logical stock availability</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Status (Backend Integration Pending):</strong> This is the Warehouse Receiving Dock module. All data is simulated; no real financial or stock mutation is performed.
        </div>
      </div>

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReceivingMonitorPanel shipments={mockShipments} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              Inspection Checklist Shell
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Verify PO Reference</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Check for Damage</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <input type="checkbox" readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-[10px] font-bold text-slate-600">Count vs Packing List</span>
              </div>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer">
              Begin Inspection
            </button>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
            <h5 className="text-[10px] font-bold text-rose-900 uppercase">Variance Reporting Shell</h5>
            <p className="text-[10px] text-rose-800 leading-relaxed font-medium italic">
              "All quantity variances or damaged items must be logged with photos. Automated debit notes will be generated upon confirmation."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementReceivingPage;
