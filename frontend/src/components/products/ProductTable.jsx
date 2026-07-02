import { Link } from 'react-router-dom';
import { Plus, Minus, Search } from 'lucide-react';

export default function ProductTable({ products, quantities, handleQuantityChange, handleAdd }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xl z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-slate-200/60">
          <tr>
            <th className="w-[40%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
            <th className="w-[20%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Inventory Status</th>
            <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
            <th className="w-[25%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.length > 0 ? (
            products.map((product) => {
              // Dynamically determine the lowest available level category
              const lowestCategory = product.cat3 || product.cat2 || product.cat1 || product.displayCategory;

              return (
                <tr key={product._id} className="hover:bg-white/60 transition-colors duration-200 group">
                  
                  {/* Column 1: SKU & Description & Category */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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

                  {/* Column 2: Consolidated Stock Information */}
                  <td className="px-6 py-4 align-top hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">
                        {product.available} <span className="text-xs font-semibold text-slate-500 font-normal">in stock</span>
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Ord: {product.onOrder}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>Min/Max: {product.min}/{product.max}</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Price */}
                  <td className="px-6 py-4 align-top text-right">
                    <span className="text-sm font-black text-slate-900">
                      ${(product.price || product.cost || 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Column 4: Fused Action Pill */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center justify-end">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                        <input
                          type="text"
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
            })
          ) : (
            <tr>
              <td colSpan="4" className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="h-16 w-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/60">
                    <Search className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-black text-slate-900">No products found</p>
                  <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
                    Adjust your search filters or check your assigned division permissions.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}