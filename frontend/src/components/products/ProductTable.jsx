import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Search, Package } from 'lucide-react';

// Internal component to gracefully handle broken or missing image links
const ProductThumbnail = ({ src, alt, sizeClass = "h-16 w-16" }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`${sizeClass} shrink-0 bg-gradient-to-tr from-slate-50 to-slate-100 rounded-xl sm:rounded-2xl border border-white/80 shadow-inner flex items-center justify-center overflow-hidden`}>
      {src && !hasError ? (
        <img 
          src={src} 
          alt={alt || 'Product Image'}
          onError={() => setHasError(true)}
          className="h-full w-full object-contain p-1.5 mix-blend-multiply"
          loading="lazy"
        />
      ) : (
        <Package className="h-1/2 w-1/2 text-slate-300" />
      )}
    </div>
  );
};

export default function ProductTable({ products, quantities, handleQuantityChange, handleAdd }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      {products.length > 0 ? (
        <>
          {/* MOBILE VIEW: Stacked Cards */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {products.map((product) => {
              const lowestCategory = product.cat3 || product.cat2 || product.cat1 || product.displayCategory;

              return (
                <div key={product._id} className="bg-white/40 border border-white/60 rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                  
                  {/* Top Row: Image & Details */}
                  <div className="flex gap-4 items-start">
                    <ProductThumbnail src={product.image} alt={product.desc} sizeClass="h-20 w-20" />
                    
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <Link 
                          to={`/products/${encodeURIComponent(product.id)}`}
                          className="text-sm font-black text-blue-600 hover:text-indigo-600 transition-colors underline-offset-4 hover:underline truncate"
                        >
                          {product.id}
                        </Link>
                        <span className="text-sm font-black text-slate-900 shrink-0">
                          ${(product.price || product.cost || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <span className="inline-flex w-max items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200/60 truncate max-w-full">
                        {lowestCategory}
                      </span>
                      
                      <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-2 mt-0.5" title={product.desc}>
                        {product.desc}
                      </p>
                    </div>
                  </div>

                  {/* Inventory Mini-Stats */}
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 p-2.5 rounded-xl border border-white/60">
                    <span><strong className="text-slate-800">{product.available}</strong> in stock</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span><strong className="text-slate-800">{product.onOrder}</strong> on order</span>
                  </div>

                  {/* Action Pill (Full Width) */}
                  <div className="flex items-center bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden h-12 w-full focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="4"
                      placeholder="Qty"
                      value={quantities[product.id] || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="w-20 h-full px-2 text-center text-sm font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300 placeholder:font-semibold"
                    />
                    <div className="h-6 w-px bg-slate-200 shrink-0"></div>
                    <button 
                      onClick={() => handleAdd(product)}
                      disabled={!quantities[product.id] || quantities[product.id] === '0'}
                      className="flex-1 flex items-center justify-center gap-2 h-full bg-slate-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: Data Table */}
          <table className="hidden md:table w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xl z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-slate-200/60">
              <tr>
                {/* 10 + 35 + 20 + 15 + 20 = 100% properly distributed */}
                <th className="w-[10%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Image</th>
                <th className="w-[35%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                <th className="w-[20%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Inventory Status</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                <th className="w-[20%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {products.map((product) => {
                const lowestCategory = product.cat3 || product.cat2 || product.cat1 || product.displayCategory;

                return (
                  <tr key={product._id} className="hover:bg-white/60 transition-colors duration-200 group">
                    
                    {/* Column 1: Image Thumbnail */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-center">
                        <ProductThumbnail src={product.image} alt={product.desc} sizeClass="h-14 w-14" />
                      </div>
                    </td>

                    {/* Column 2: SKU & Description & Category */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Link 
                            to={`/products/${encodeURIComponent(product.id)}`}
                            className="text-sm font-black text-blue-600 hover:text-indigo-600 transition-colors underline-offset-4 hover:underline truncate"
                          >
                            {product.id}
                          </Link>
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200/60 shrink-0 truncate max-w-[120px]"
                            title={lowestCategory}
                          >
                            {lowestCategory}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600 truncate pr-4" title={product.desc}>
                          {product.desc}
                        </p>
                      </div>
                    </td>

                    {/* Column 3: Consolidated Stock Information */}
                    <td className="px-6 py-4 align-top hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">
                          {product.available} <span className="text-xs font-medium text-slate-500 ml-1">in stock</span>
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Ord: {product.onOrder}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>Min/Max: {product.min}/{product.max}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Price */}
                    <td className="px-6 py-4 align-top text-right">
                      <span className="text-sm font-black text-slate-900">
                        ${(product.price || product.cost || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Column 5: Fused Action Pill */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center justify-end">
                        <div className="flex items-center bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength="4"
                            placeholder="Qty"
                            value={quantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-14 h-10 px-2 text-center text-sm font-black text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300 placeholder:font-semibold"
                          />
                          <div className="h-6 w-px bg-slate-200"></div>
                          <button 
                            onClick={() => handleAdd(product)}
                            disabled={!quantities[product.id] || quantities[product.id] === '0'}
                            className="flex items-center justify-center h-10 w-12 bg-slate-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                            title="Add to Cart"
                          >
                            <Plus className="h-5 w-5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        /* Unified Empty State */
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
          <div className="h-16 w-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/60">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-black text-slate-900">No products found</p>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
            Adjust your search filters or check your assigned division permissions.
          </p>
        </div>
      )}
    </div>
  );
}