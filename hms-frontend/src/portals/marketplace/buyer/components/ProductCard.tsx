import React from 'react';
import { ShoppingCart, FileText, Star, Shield, Wrench } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  hasInstallation: boolean;
  hasWarranty: boolean;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          <Box className="h-12 w-12" />
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.hasInstallation && (
            <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm" title="Installation Included">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          )}
          {product.hasWarranty && (
            <div className="bg-indigo-500 text-white p-1.5 rounded-lg shadow-sm" title="Warranty Protected">
              <Shield className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand}</p>
          <h3 className="text-sm font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={onViewDetails}>
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < product.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">({product.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <p className="text-base font-black text-slate-900">₱{product.price.toLocaleString()}</p>
          <div className="flex gap-2">
            <button 
              onClick={onAddToCart}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              title="Simulation: Add to Cart (Shell)"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            <button 
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              title="Simulation: Request Quote (Shell)"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Box } from 'lucide-react';
export default ProductCard;
