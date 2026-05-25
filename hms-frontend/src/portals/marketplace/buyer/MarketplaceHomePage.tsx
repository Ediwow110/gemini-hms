import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  ShieldCheck,
  Package,
  ArrowRight,
  Box,
  Loader2,
  AlertCircle
} from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import MarketplaceSearchBar from './components/MarketplaceSearchBar';
import CategoryNavigation from './components/CategoryNavigation';
import ProductCard, { Product } from './components/ProductCard';
import { apiClient } from '../../../lib/api';

interface MarketplaceListing {
  id: string;
  serviceItem: {
    id: string;
    name: string;
    code: string;
    category: { name: string };
    prices: { price: number }[];
  };
  supplier?: { name: string };
  priceOverride?: number;
  description?: string;
  createdAt: string;
}

export const MarketplaceHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await apiClient.get('/marketplace/listings');
        setListings(response.data);
      } catch (err) {
        console.error('Failed to fetch marketplace listings:', err);
        setError('Failed to load marketplace data.');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Map backend listing to ProductCard interface
  const featuredProducts: Product[] = listings.map(l => ({
    id: l.id,
    name: l.serviceItem.name,
    brand: l.supplier?.name || 'Various Suppliers',
    price: l.priceOverride || (l.serviceItem.prices && l.serviceItem.prices[0]?.price) || 0,
    rating: 5,
    reviews: 0,
    image: '',
    hasInstallation: true,
    hasWarranty: true,
    category: l.serviceItem.category?.name || 'General'
  }));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-slate-900 rounded-[2rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Equipment & Service <br />
            <span className="text-indigo-400">Marketplace Hub.</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">
            Provision your facility with world-class medical equipment, maintenance services, and supply chain logistics.
          </p>
          <MarketplaceSearchBar />
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-20 -bottom-20 h-96 w-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <MarketplaceShellNotice />

      {/* Category Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Browse by Category</h3>
          </div>
        </div>
        <CategoryNavigation />
      </section>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/marketplace/rfqs')}
          className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <FileText className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Request Quotes</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Multi-vendor RFQ</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/marketplace/orders')}
          className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Package className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Track Orders</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Logistics status</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/marketplace/warranty')}
          className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Warranties</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Asset protection</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/marketplace/service-tickets')}
          className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
            <Clock className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Service Desk</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Maintenance log</p>
          </div>
        </button>
      </div>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Featured Equipment Packages</h3>
            <p className="text-xs text-slate-500 font-medium">Recommended for your facility type</p>
          </div>
          <button 
            onClick={() => navigate('/marketplace/products')}
            className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View All Catalog <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Marketplace...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onAddToCart={() => navigate('/marketplace/cart')}
                  onViewDetails={() => navigate(`/marketplace/products/${p.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No listings available</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Frequently Ordered / Best Value Bundles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Best Value Bundles
          </h4>
          <div className="space-y-3">
             {[1, 2].map((i) => (
               <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                     <Box className="h-5 w-5 text-slate-400" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-slate-800">Complete Diagnostic Suite v{i}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Includes Installation & 3yr Warranty</p>
                   </div>
                 </div>
                 <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Recent Activity
          </h4>
          <div className="space-y-3">
             <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
               <div className="h-2 w-2 bg-emerald-500 rounded-full" />
               <div className="flex-1">
                 <p className="text-xs font-black text-slate-800">RFQ-2026-042 Approved</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Awaiting supplier quote selection</p>
               </div>
               <span className="text-[10px] text-slate-300 font-bold">2H AGO</span>
             </div>
             <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
               <div className="h-2 w-2 bg-indigo-500 rounded-full" />
               <div className="flex-1">
                 <p className="text-xs font-black text-slate-800">Order ORD-9918 Shipped</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated delivery in 3 days</p>
               </div>
               <span className="text-[10px] text-slate-300 font-bold">5H AGO</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHomePage;
