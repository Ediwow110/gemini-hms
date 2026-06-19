import React, { useState } from 'react';
import { Package, Truck, Clock, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import OrderTrackingTimeline from './components/OrderTrackingTimeline';

export const MarketplaceOrdersPage: React.FC = () => {
  // No backend orders endpoint wired for buyer order history in current release.
  // Using honest empty state (no fake records).
  const [orders] = useState<any[]>([]);
  const [loading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Marketplace Orders</h2>
          <p className="text-xs text-slate-500 font-medium">Track your procurement history and logistics status</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search orders..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs" />
        </div>
      </div>

      <MarketplaceShellNotice />

      {loading && <div className="text-xs px-1">Loading...</div>}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-6 border rounded-2xl text-sm text-slate-500 bg-white">No orders found. Buyer order history and tracking require additional backend endpoints not yet implemented.</div>
        ) : orders.map((order) => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Package className="h-6 w-6" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-800">{order.id}</h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                    order.status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    order.status === 'PROCESSING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">{order.items}</p>
              </div>

              <div className="flex flex-wrap items-center gap-8 lg:text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-sm font-black text-slate-900">₱{order.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Date</p>
                  <p className="text-xs font-bold text-slate-600">{order.date}</p>
                </div>
                <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Simple Progress Bar */}
            <div className="mt-6 pt-6 border-t border-slate-50">
               <OrderTrackingTimeline 
                 steps={[
                   { label: 'Placed', icon: CheckCircle2, completed: true },
                   { label: 'Processing', icon: Clock, completed: order.status !== 'PLACED' },
                   { label: 'Shipped', icon: Truck, completed: order.status === 'SHIPPED' || order.status === 'DELIVERED' },
                   { label: 'Delivered', icon: Package, completed: order.status === 'DELIVERED' },
                 ]} 
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceOrdersPage;
