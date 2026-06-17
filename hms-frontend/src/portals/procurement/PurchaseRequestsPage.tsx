import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { PurchaseRequestQueue, PurchaseRequest } from './components/PurchaseRequestQueue';
import { FilePlus, Plus } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

export const PurchaseRequestsPage: React.FC = () => {
  const mockRequests: PurchaseRequest[] = [
    { id: 'PR-1001', item: 'CBC Reagents (Bulk)', category: 'Laboratory', requestedBy: 'Requester 001', branch: 'St. Jude Metro', priority: 'URGENT', status: 'PENDING', date: '2026-05-21' },
    { id: 'PR-1002', item: 'Latex Gloves (Medium)', category: 'Consumables', requestedBy: 'Requester 002', branch: 'St. Jude Metro', priority: 'NORMAL', status: 'PENDING', date: '2026-05-20' },
    { id: 'PR-1003', item: 'MRI Cooling Helium', category: 'Maintenance', requestedBy: 'Engr. Smith', branch: 'St. Jude North', priority: 'URGENT', status: 'PENDING', date: '2026-05-21' },
    { id: 'PR-1004', item: 'Surgical Gowns (L)', category: 'Theatre', requestedBy: 'Requester 003', branch: 'St. Jude Metro', priority: 'NORMAL', status: 'PENDING', date: '2026-05-19' },
    { id: 'PR-1005', item: 'Defibrillator Pads', category: 'Emergency', requestedBy: 'Nurse Wilson', branch: 'St. Jude Metro', priority: 'URGENT', status: 'APPROVED', date: '2026-05-18' },
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Internal Purchase Requests"
        description="Review and approve department requisitions for stock and equipment"
        actions={(
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> Create Requisition
          </button>
        )}
      />

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PurchaseRequestQueue requests={mockRequests.filter(r => r.status === 'PENDING')} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-indigo-500" />
              Budget Verification Shell
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-slate-400 font-medium">Automatic budget availability check will appear here</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Current Q2 Dept Budget</span>
                <span className="text-indigo-600">₱450,000.00</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Committed (Pending)</span>
                <span className="text-amber-600">₱124,000.00</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Approval Policy Shell</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Requests over ₱50,000 require CFO approval. Urgent medical supplies may bypass standard quote cycles if a pre-accredited vendor is used.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Status (Backend Integration Pending):</strong> This is the Internal Purchase Requests module. All data is simulated; no real financial or stock mutation is performed.
      </div>
    </HmsDashboardShell>
  );
};

export default PurchaseRequestsPage;
