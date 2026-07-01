import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventory } from '../store/slices/inventorySlice';
import { Search, Plus, ShoppingCart, ChevronRight, Layers, Loader2, AlertCircle, Box } from 'lucide-react';

export default function Products() {
  const dispatch = useDispatch();
  
  // Connect to Redux state modules
  const { user } = useSelector((state) => state.auth);
  const { items, status, error } = useSelector((state) => state.inventory);
  const activeDivision = useSelector((state) => state.divisions.activeDivision);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [quantities, setQuantities] = useState({});

  // Extract the active division ID from the Redux selection context
  const divisionId = activeDivision?._id || activeDivision;

  // Fetch inventory cleanly scoped to the selected working division workspace
  useEffect(() => {
    if (divisionId) {
      dispatch(fetchInventory(divisionId));
    }
  }, [dispatch, divisionId]);

  // Dynamically derive sidebar categories from items matching the selected division context
  const dynamicCategories = useMemo(() => {
    const categoryMap = {};
    
    items.forEach(item => {
      // Security Check: Verify item matches the currently activated workspace division ID
      const itemDivisionId = item.division?._id || item.division;
      if (itemDivisionId !== divisionId) return;

      const divisionName = item.division?.divisionName || 'Uncategorized';
      const catName = item.category1?.categoryName || 'General';
      
      if (!categoryMap[divisionName]) {
        categoryMap[divisionName] = new Set();
      }
      categoryMap[divisionName].add(catName);
    });

    return Object.entries(categoryMap).map(([division, subCats]) => ({
      division,
      sub: Array.from(subCats).sort()
    })).sort((a, b) => a.division.localeCompare(b.division));
  }, [items, divisionId]);

  // Map the raw MongoDB items to our UI structure following the exact division-scoped criteria
  const filteredProducts = useMemo(() => {
    const mapped = items
      .filter(item => {
        const itemDivisionId = item.division?._id || item.division;
        return itemDivisionId === divisionId;
      })
      .map(item => ({
        _id: item._id,
        id: item.sku || 'N/A', 
        desc: item.itemName || 'Unknown Item',
        min: item.safetyBuffer || item.min || 0,
        max: item.max || '-', 
        available: item.unitsOnHand || 0,
        onOrder: item.pipelineSupply || 0,
        category: item.category1?.categoryName || 'General',
        division: item.division?.divisionName || 'Uncategorized',
        price: item.price || 0,
        cost: item.unitCost || item.price || 0,
        unitCost: item.unitCost || item.price || 0
      }));

    const finalFiltered = mapped.filter(product => {
      const matchesSearch = 
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort the products alphanumerically by item code (SKU)
    return finalFiltered.sort((a, b) => 
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [items, searchQuery, activeCategory, divisionId]);

  const handleQuantityChange = (id, value) => {
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAdd = (product) => {
    const qty = parseInt(quantities[product.id] || 0, 10);
    if (qty > 0) {
      dispatch(addToCart({ product, quantity: qty }));
      setQuantities(prev => ({ ...prev, [product.id]: '' }));
    }
  };

  // --- Render Loader States ---
  if (status === 'loading' || !divisionId) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Syncing Division Inventory...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Failed to load inventory</h2>
          <p className="text-gray-500 mt-2 font-medium">{error}</p>
          <button 
            onClick={() => divisionId && dispatch(fetchInventory(divisionId))}
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] pt-6 animate-in fade-in duration-700">
      
      {/* Subtle Background Decorative Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden h-full">
        <div className="p-4 border-b border-white/50 bg-white/30">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeCategory === 'All' 
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Products
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {dynamicCategories.map((cat) => (
            <div key={cat.division} className="mb-6">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                {cat.division}
              </h3>
              <div className="flex flex-col space-y-1">
                {cat.sub.map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setActiveCategory(subCat)}
                    className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-between group ${
                      activeCategory === subCat 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{subCat}</span>
                    {activeCategory === subCat && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full overflow-hidden">
        
        {/* Top Header & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 lg:px-8 lg:py-6 border-b border-white/50 bg-white/30 z-10">
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner shrink-0">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <span className="truncate">{activeCategory === 'All' ? 'Complete Catalog' : activeCategory}</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1.5 ml-[52px] uppercase tracking-widest">
              {filteredProducts.length} Items Indexed
            </p>
          </div>

          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by SKU or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* High-Density Product Table */}
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200/60 shrink-0">
                            {product.category}
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
                ))
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
      </main>

    </div>
  );
}