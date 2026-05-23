import React from 'react';
import { 
  Truck, 
  FilePlus, 
  Send, 
  ShoppingBag, 
  PackageCheck, 
  Trophy, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { SupplierSummaryCard } from './components/SupplierSummaryCard';
import { PurchaseRequestQueue, PurchaseRequest } from './components/PurchaseRequestQueue';
import { RFQStatusPanel, RFQItem } from './components/RFQStatusPanel';
import { ReceivingMonitorPanel, ReceivingItem } from './components/ReceivingMonitorPanel';
import { QuoteSubmissionsPanel, QuoteBrief } from './components/QuoteSubmissionsPanel';

export const ProcurementDashboard: React.FC = () => {
  const navigate = useNavigate();

  const mockRequests: PurchaseRequest[] = [
    { id: 'PR-1001', item: 'CBC Reagents (Bulk)', category: 'Laboratory', requestedBy: 'Dr. House', branch: 'St. Jude Metro', priority: 'URGENT', status: 'PENDING', date: '2026-05-21' },
    { id: 'PR-1002', item: 'Latex Gloves (Medium)', category: 'Consumables', requestedBy: 'Nurse Hopps', branch: 'St. Jude Metro', priority: 'NORMAL', status: 'PENDING', date: '2026-05-20' },
    { id: 'PR-1003', item: 'MRI Cooling Helium', category: 'Maintenance', requestedBy: 'Engr. Smith', branch: 'St. Jude North', priority: 'URGENT', status: 'PENDING', date: '2026-05-21' },
  ];

  const mockRFQs: RFQItem[] = [
    { id: 'RFQ-001', reference: 'RFQ/2026/05/MED-SUP', items: 'Medical Grade Consumables Pack', invitedSuppliers: 5, quotesReceived: 3, deadline: '2026-05-25', status: 'OPEN' },
    { id: 'RFQ-002', reference: 'RFQ/2026/05/LAB-RE', items: 'Chemistry Analyzer Reagents', invitedSuppliers: 3, quotesReceived: 1, deadline: '2026-05-28', status: 'OPEN' },
  ];

  const mockShipments: ReceivingItem[] = [
    { id: 'REC-001', poNumber: 'PO-2026-441', supplier: 'Apex Medical Corp', expectedDate: 'Today', itemsCount: 15, status: 'PENDING' },
    { id: 'REC-002', poNumber: 'PO-2026-438', supplier: 'Global Pharma Inc', expectedDate: 'Yesterday', itemsCount: 8, status: 'ISSUE' },
  ];

  const mockQuoteBriefs: QuoteBrief[] = [
    { id: 'Q-001', supplier: 'Apex Medical Corp', rfqReference: 'RFQ/2026/05/MED-SUP', amount: 125000, submittedAt: '2h ago' },
    { id: 'Q-002', supplier: 'Global Pharma Inc', rfqReference: 'RFQ/2026/05/MED-SUP', amount: 132000, submittedAt: '4h ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Procurement & Supply Chain Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage suppliers, purchasing workflows, and inventory requisitions</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> All supply chain data is simulated. No real financial commitments or stock mutations are performed.
        </div>
      </div>

      <ProcurementScopeFilter />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SupplierSummaryCard 
          title="Active Suppliers" 
          value="84" 
          icon={Truck} 
          description="Accredited vendors" 
          trend={{ value: "2 new this month", isUp: true }}
        />
        <SupplierSummaryCard 
          title="Open POs" 
          value="12" 
          icon={ShoppingBag} 
          description="Awaiting delivery" 
          trend={{ value: "4 delayed", isUp: false }}
        />
        <SupplierSummaryCard 
          title="Avg. RFQ Response" 
          value="2.4d" 
          icon={Send} 
          description="Lead time for quotes" 
        />
        <SupplierSummaryCard 
          title="Budget Alert" 
          value="₱1.2M" 
          icon={AlertCircle} 
          description="Remaining for Q2 consumables" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PurchaseRequestQueue requests={mockRequests} />
          
          <QuoteSubmissionsPanel quotes={mockQuoteBriefs} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RFQStatusPanel rfqs={mockRFQs} />
            <ReceivingMonitorPanel shipments={mockShipments} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Procurement Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/procurement/purchase-requests')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>New Purchase Request</span>
                <FilePlus className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/procurement/rfqs')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Draft New RFQ</span>
                <Send className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/procurement/purchase-orders')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Generate Purchase Order</span>
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
              </button>
              <button
                onClick={() => navigate('/procurement/receiving')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
              >
                <span>Record Stock Arrival</span>
                <PackageCheck className="h-4 w-4 text-indigo-500" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
              <h5 className="text-xs font-bold text-indigo-900 uppercase">Vendor Insight</h5>
            </div>
            <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold">
              Apex Medical Corp has maintained a 98% on-time delivery rate this quarter. Consider them for the upcoming MRI maintenance RFQ.
            </p>
            <button
              onClick={() => navigate('/procurement/vendor-performance')}
              className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 cursor-pointer hover:text-indigo-900 transition-colors"
            >
              View Performance Matrix <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
