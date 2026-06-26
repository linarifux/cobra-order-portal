import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventory } from '../store/slices/inventorySlice';
import { Search, Plus, ShoppingCart, ChevronRight, Layers, Loader2, AlertCircle } from 'lucide-react';

export default function Products() {
  const dispatch = useDispatch();
  
  // Connect to Redux Auth to get the user's logged-in profile context
  const { user } = useSelector((state) => state.auth);
  const { items, status, error } = useSelector((state) => state.inventory);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [quantities, setQuantities] = useState({});

  // Safely extract dynamic context from the session profile
  const customerId = user?.customer;
  const userAllowedDivisions = user?.divisions || [];

  // Fetch Inventory reliably on mount whenever the user's customer context is available
  useEffect(() => {
    if (customerId) {
      dispatch(fetchInventory(customerId));
    }
  }, [dispatch, customerId]);

  // Dynamically derive sidebar categories from items matching the user's allowed division access
  const dynamicCategories = useMemo(() => {
    const categoryMap = {};
    
    items.forEach(item => {
      // Access Filtering: Verify if the user has permission for this item's specific division ID
      const hasDivisionAccess = userAllowedDivisions.includes(item.division?._id || item.division);
      if (!hasDivisionAccess) return;

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
  }, [items, userAllowedDivisions]);

  // Map the raw MongoDB items to our UI structure following the exact property schema
  const filteredProducts = useMemo(() => {
    const mapped = items
      .filter(item => {
        // Enforce boundary security check matching user profile division clearances
        return userAllowedDivisions.includes(item.division?._id || item.division);
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
        unitCost: item.unitCost || 0
      }));

    const finalFiltered = mapped.filter(product => {
      const matchesSearch = 
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // FIX: Sort the products by item code (SKU) alphanumerically
    return finalFiltered.sort((a, b) => 
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [items, searchQuery, activeCategory, userAllowedDivisions]);

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
  if (status === 'loading' || !customerId) {
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
            onClick={() => customerId && dispatch(fetchInventory(customerId))}
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)] animate-in fade-in duration-700">
      
      {/* Subtle Background Decorative Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden h-full">
        <div className="p-4 border-b border-white/50 bg-white/30">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeCategory === 'All' 
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-700 hover:bg-white/60 hover:shadow-sm'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Products
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {dynamicCategories.map((cat) => (
            <div key={cat.division} className="mb-6">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1 mb-2">
                {cat.division}
              </h3>
              <div className="flex flex-col space-y-1">
                {cat.sub.map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setActiveCategory(subCat)}
                    className={`text-left px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center justify-between group ${
                      activeCategory === subCat 
                        ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-200/50 shadow-sm' 
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <span>{subCat}</span>
                    {activeCategory === subCat && <ChevronRight className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full overflow-hidden">
        
        {/* Top Header & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 lg:px-8 lg:py-6 border-b border-white/50 bg-white/30 z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              {activeCategory === 'All' ? 'Product Catalog' : activeCategory}
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1 ml-14">
              Showing {filteredProducts.length} items
            </p>
          </div>

          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by SKU or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white/60 backdrop-blur-md z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">SKU</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Description</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Min / Max</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Available</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">On Order</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-white/60 transition-colors duration-200 group">
                    <td className="px-8 py-5">
                      <Link 
                        to={`/products/${encodeURIComponent(product.id)}`}
                        className="text-sm font-bold text-blue-600 hover:text-indigo-600 transition-colors underline-offset-4 hover:underline"
                      >
                        {product.id}
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-gray-900">{product.desc}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-semibold text-gray-600 bg-white/50 border border-white/80 px-2.5 py-1.5 rounded-lg shadow-sm">
                        {product.min} / {product.max}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-gray-900">{product.available}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-gray-500">{product.onOrder}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                        <input
                          type="text"
                          maxLength="4"
                          placeholder="Qty"
                          value={quantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-16 h-10 px-2 text-center text-sm font-medium bg-white/50 border border-white/60 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                        />
                        <button 
                          onClick={() => handleAdd(product)}
                          disabled={!quantities[product.id] || quantities[product.id] === '0'}
                          className="flex items-center justify-center h-10 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white/60">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">No products found</p>
                      <p className="text-sm font-medium text-gray-500 mt-1">Check database connection or adjust your filtering parameters.</p>
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