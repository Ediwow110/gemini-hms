import React, { useEffect, useState } from 'react';
import { Package, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../../lib/api';

export const SupplierOrderQueue: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/marketplace/supplier/orders');
        setOrders(response.data.salesOrders || []);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Failed to fetch supplier orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-tight uppercase">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-rose-50 border border-rose-100 rounded-3xl text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <p className="text-sm font-black text-rose-800 tracking-tight uppercase">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-sm font-black text-slate-500 tracking-tight uppercase">No active orders</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Order Queue</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((order) => (
          <div key={order.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-indigo-50 text-indigo-600 border-indigo-100">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {order.quote?.rfq?.title || 'Marketplace Order'}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {order.orderNumber} · {order.id.substring(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase">
                  {order.status}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xs font-black text-slate-800">₱{Number(order.totalAmount).toLocaleString()}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierOrderQueue;
