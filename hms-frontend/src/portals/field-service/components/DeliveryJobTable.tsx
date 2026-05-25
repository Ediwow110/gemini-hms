import React, { useEffect, useState } from 'react';
import { Truck, ChevronRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export const DeliveryJobTable: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/logistics/shipments');
        setShipments(response.data);
      } catch (error) {
        console.error('Failed to fetch shipments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Deliveries</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
            No active shipments found
          </div>
        ) : (
          shipments.map((shipment) => (
            <div key={shipment.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                  shipment.status === 'SHIPPED' || shipment.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{shipment.trackingNumber || `SHIP-${shipment.id.substring(0, 4)}`}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Order: {shipment.salesOrder.id.substring(0, 8)}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                    shipment.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    shipment.status === 'SHIPPED' || shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carrier</p>
                  <p className="text-xs font-black text-slate-800">{shipment.carrier || 'Internal Logistics'}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryJobTable;
