import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { PurchaseOrderTable, PurchaseOrder } from './components/PurchaseOrderTable';
import { FilePlus } from 'lucide-react';
import { ReportExportButton } from '../../components/analytics';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

export const PurchaseOrdersPage: React.FC = () => {
  const mockOrders: PurchaseOrder[] = [
    { id: 'PO-2026-441', poNumber: 'PO-2026-441', supplier: 'Apex Medical Corp', amount: 125000, date: '2026-05-20', status: 'ISSUED', deliveryStatus: 'PENDING' },
    { id: 'PO-2026-440', poNumber: 'PO-2026-440', supplier: 'Global Pharma Inc', amount: 45000, date: '2026-05-18', status: 'SHIPPED', deliveryStatus: 'ON_TIME' },
    { id: 'PO-2026-438', poNumber: 'PO-2026-438', supplier: 'Global Pharma Inc', amount: 22000, date: '2026-05-12', status: 'SHIPPED', deliveryStatus: 'DELAYED' },
    { id: 'PO-2026-435', poNumber: 'PO-2026-435', supplier: 'Stellar Imaging', amount: 850000, date: '2026-05-05', status: 'RECEIVED', deliveryStatus: 'ON_TIME' },
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Purchase Order Management"
        description="Tracking issued orders, delivery status, and financial disbursement authorization"
        actions={(
          <div className="flex gap-2">
            <ReportExportButton label="Export PO register" sensitive requiresReason />
            <button type="button" disabled title="Backend POST /api/v1/procurement/purchase-orders exists, but the creation form/UI is not yet implemented on this page. Action remains unavailable from this UI." className="btn cursor-not-allowed bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200">
              <FilePlus className="h-4 w-4" /> New PO WIP
            </button>
          </div>
        )}
      />

      <ProcurementScopeFilter />

      <PurchaseOrderTable orders={mockOrders} />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Status (Backend Integration Pending):</strong> This is the Purchase Order Management module. All data is simulated; no real financial or stock mutation is performed.
      </div>
    </HmsDashboardShell>
  );
};

export default PurchaseOrdersPage;
