import React, { useState, useEffect } from 'react';
import { ChevronDown, Grid, List } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import ProductCard, { Product } from './components/ProductCard';
import ProductFilterPanel from './components/ProductFilterPanel';
import CompareBar from './components/CompareBar';
import { apiClient } from '../../../lib/api';

interface BackendListing {
  id: string;
  priceOverride?: number | null;
  serviceItem?: {
    id: string;
    name: string;
    code?: string;
    category?: { name?: string } | null;
  } | null;
  supplier?: { name?: string } | null;
}

export const MarketplaceProductListingPage: React.FC = () => {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/v1/marketplace/listings');
        const listings: BackendListing[] = res.data || [];
        const mapped: Product[] = listings.map((l) => ({
          id: l.id,
          name: l.serviceItem?.name || 'Unknown Item',
          brand: l.supplier?.name || 'Supplier',
          price: l.priceOverride || 0,
          rating: 4,
          reviews: 10,
          image: '',
          hasInstallation: true,
          hasWarranty: true,
          category: l.serviceItem?.category?.name || 'General',
        }));
        setProducts(mapped);
      } catch (e: any) {
        setError('Backend listings endpoint returned error or no data. Showing honest empty state.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchListings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 font-medium">Browse and compare professional medical equipment</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            <button className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm"><Grid className="h-4 w-4" /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><List className="h-4 w-4" /></button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Sort by: Popularity <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <MarketplaceShellNotice />

      {loading && <div className="text-xs text-slate-500 px-1">Loading live listings from /v1/marketplace/listings...</div>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <aside className="space-y-6">
          <ProductFilterPanel />
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing {products.length} Results</p>
          </div>
          {products.length === 0 && !loading ? (
            <div className="text-sm text-slate-500 p-4 border rounded">No approved marketplace listings available from backend yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onAddToCart={() => { /* cart not fully wired; demo only */ }}
                  onViewDetails={() => { /* navigate would use real id */ }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CompareBar 
        selectedCount={selectedForCompare.length} 
        onClear={() => setSelectedForCompare([])} 
      />
    </div>
  );
};

export default MarketplaceProductListingPage;
