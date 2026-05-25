import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { PurchaseOrderTable, PurchaseOrder } from './components/PurchaseOrderTable';
import { FilePlus, Download } from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const mockOrders: PurchaseOrder[] = [
    { id: 'PO-2026-441', poNumber: 'PO-2026-441', supplier: 'Apex Medical Corp', amount: 125000, date: '2026-05-20', status: 'ISSUED', deliveryStatus: 'PENDING' },
    { id: 'PO-2026-440', poNumber: 'PO-2026-440', supplier: 'Global Pharma Inc', amount: 45000, date: '2026-05-18', status: 'SHIPPED', deliveryStatus: 'ON_TIME' },
    { id: 'PO-2026-438', poNumber: 'PO-2026-438', supplier: 'Global Pharma Inc', amount: 22000, date: '2026-05-12', status: 'SHIPPED', deliveryStatus: 'DELAYED' },
    { id: 'PO-2026-435', poNumber: 'PO-2026-435', supplier: 'Stellar Imaging', amount: 850000, date: '2026-05-05', status: 'RECEIVED', deliveryStatus: 'ON_TIME' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Purchase Order Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Tracking issued orders, delivery status, and financial disbursement authorization</p>
        </div>
        <div className="flex gap-2">
          <button className="btn bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
            <Download className="h-4 w-4" /> Export PO Register
          </button>
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <FilePlus className="h-4 w-4" /> New PO
          </button>
        </div>
      </div>

      <ProcurementScopeFilter />

      <PurchaseOrderTable orders={mockOrders} />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Status (Backend Integration Pending):</strong> This is the Purchase Order Management module. All data is simulated; no real financial or stock mutation is performed.
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
