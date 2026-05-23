import React, { useState } from 'react';
import { ChevronDown, Grid, List } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import ProductCard, { Product } from './components/ProductCard';
import ProductFilterPanel from './components/ProductFilterPanel';
import CompareBar from './components/CompareBar';

export const MarketplaceProductListingPage: React.FC = () => {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  
  const mockProducts: Product[] = [
    { id: '1', name: 'GE Healthcare Voluson E10 BT20', brand: 'GE Healthcare', price: 4250000, rating: 5, reviews: 12, image: '', hasInstallation: true, hasWarranty: true, category: 'Imaging' },
    { id: '2', name: 'Roche cobas c 311 analyzer', brand: 'Roche', price: 1850000, rating: 4, reviews: 8, image: '', hasInstallation: true, hasWarranty: true, category: 'Laboratory' },
    { id: '3', name: 'Philips Affiniti 70 Ultrasound', brand: 'Philips', price: 3100000, rating: 5, reviews: 15, image: '', hasInstallation: true, hasWarranty: true, category: 'Imaging' },
    { id: '4', name: 'Mindray BeneVision N17 Monitor', brand: 'Mindray', price: 450000, rating: 4, reviews: 22, image: '', hasInstallation: false, hasWarranty: true, category: 'Clinical' },
    { id: '5', name: 'Sysmex XN-1000 Hematology', brand: 'Sysmex', price: 2200000, rating: 5, reviews: 30, image: '', hasInstallation: true, hasWarranty: true, category: 'Laboratory' },
    { id: '6', name: 'Dräger Fabius Plus XL', brand: 'Dräger', price: 1250000, rating: 4, reviews: 14, image: '', hasInstallation: true, hasWarranty: true, category: 'Clinical' },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <aside className="space-y-6">
          <ProductFilterPanel />
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Showing {mockProducts.length} Results</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={() => {}}
                onViewDetails={() => {}}
              />
            ))}
          </div>
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
