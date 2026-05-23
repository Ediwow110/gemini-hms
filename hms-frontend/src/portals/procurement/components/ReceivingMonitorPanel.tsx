import React from 'react';
import { PackageCheck, Warehouse, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ReceivingItem {
  id: string;
  poNumber: string;
  supplier: string;
  expectedDate: string;
  itemsCount: number;
  status: 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'ISSUE';
}

interface ReceivingMonitorPanelProps {
  shipments: ReceivingItem[];
}

export const ReceivingMonitorPanel: React.FC<ReceivingMonitorPanelProps> = ({ shipments }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-indigo-500" />
            Receiving Monitor
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Inbound shipment tracking and inspection</p>
        </div>
        <Warehouse className="h-4 w-4 text-slate-400" />
      </div>

      <div className="space-y-3">
        {shipments.map((s) => (
          <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-800">{s.supplier}</p>
                <p className="text-[10px] text-slate-400 font-mono">PO: {s.poNumber}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                s.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                s.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {s.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500 font-bold">
                ETA: {s.expectedDate} · {s.itemsCount} Items
              </p>
              <div className="flex gap-2">
                {s.status === 'ISSUE' && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />}
                {s.status === 'RECEIVED' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> Receiving logs are mock-generated. Completing a receipt does not update real warehouse stock levels.
      </div>
    </div>
  );
};
