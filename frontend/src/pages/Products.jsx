import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart } from '../store/slices/cartSlice';
import { Search, Plus, ShoppingCart, ChevronRight, Layers } from 'lucide-react';

// --- Mock Data ---
const INVENTORY_CATEGORIES = [
  { division: 'Corporate', sub: ['Corporate', 'PPE'] },
  { division: 'CT', sub: ['Isovue', 'Protocol Touch'] },
  { division: 'CTC', sub: ['Sales Aids', 'Support Material'] },
  { division: 'Devices', sub: ['CT', 'MR', 'Support Material'] },
  { division: 'Misc Materials', sub: ['Corporate'] },
  { division: 'MRI', sub: ['MultiHance', 'ProHance', 'Support Material', 'Vueway'] },
  { division: 'Nuclear Med', sub: ['Cardiogen', 'Education', 'Heartsee', 'Kinevac', 'Reprints', 'Sales Aids'] },
  { division: 'Ultrasound', sub: ['Clinical', 'Sales Aids', 'Support Material'] },
  { division: 'Varibar', sub: ['Clinical Studies', 'Sales Aids'] },
];

const MOCK_PRODUCTS = [
  { id: '04-3022-205C', desc: 'ProHance Sticker Post Contrast 0.1', min: 0, max: 10, available: 36, onOrder: 0, category: 'Corporate' },
  { id: '05-032905', desc: 'MultiHance Film Stickers -0.1 Post Contrast', min: 0, max: 5, available: 473, onOrder: 0, category: 'MultiHance' },
  { id: '06-030706A', desc: 'Isovue 200 Labels', min: 0, max: 5, available: 1561, onOrder: 0, category: 'Isovue' },
  { id: '06-030706B', desc: 'Isovue 250 Labels', min: 0, max: 5, available: 183, onOrder: 0, category: 'Isovue' },
  { id: '06-030706C', desc: 'Isovue 300 Labels', min: 0, max: 5, available: 214, onOrder: 0, category: 'Isovue' },
  { id: '06-072406', desc: 'Bracco Napkins (each pack qty 50)', min: 0, max: 2, available: 61, onOrder: 0, category: 'Misc Materials' },
  { id: '08-050108', desc: 'MultiHance JACHO Stickers', min: 1, max: 5, available: 325, onOrder: 0, category: 'MultiHance' },
  { id: '10-042710', desc: 'Student Award Plaques', min: 0, max: 3, available: 153, onOrder: 0, category: 'Education' },
  { id: '11-062711', desc: 'Senthamizhchelvan (2010) - Human Biodistribution', min: 1, max: 25, available: 1811, onOrder: 0, category: 'Clinical Studies' },
  { id: '12-050412RPI', desc: 'Schleipman (2006) - Occupational Radiation Dose', min: 0, max: 5, available: 504, onOrder: 0, category: 'Clinical Studies' },
];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [quantities, setQuantities] = useState({});
  
  const dispatch = useDispatch();

  // Filter logic
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(product => {
      const matchesSearch = 
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleQuantityChange = (id, value) => {
    // Only allow numbers
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAdd = (product) => {
    const qty = parseInt(quantities[product.id] || 0, 10);
    if (qty > 0) {
      
      // Dispatch the item and quantity to the Redux store
      dispatch(addToCart({ product, quantity: qty }));
      
      // Reset input after adding
      setQuantities(prev => ({ ...prev, [product.id]: '' }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)] animate-in fade-in duration-500">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden h-full">
        <div className="p-4 border-b border-gray-200 bg-white">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'All' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            All Products
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {INVENTORY_CATEGORIES.map((cat) => (
            <div key={cat.division} className="mb-4">
              <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                {cat.division}
              </h3>
              <div className="flex flex-col space-y-0.5">
                {cat.sub.map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setActiveCategory(subCat)}
                    className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${
                      activeCategory === subCat 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
      <main className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm h-full overflow-hidden">
        
        {/* Top Header & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-6 border-b border-gray-100 bg-white z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              {activeCategory === 'All' ? 'Product Catalog' : activeCategory}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredProducts.length} items
            </p>
          </div>

          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-gray-50 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 shadow-sm shadow-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Product Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Min / Max</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Available</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">On Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link 
                        to={`/products/${encodeURIComponent(product.id)}`}
                        className="text-sm font-semibold text-blue-600 underline underline-offset-2 decoration-blue-200 hover:decoration-blue-600 transition-colors"
                      >
                        {product.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{product.desc}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {product.min} / {product.max}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{product.available}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{product.onOrder}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        <input
                          type="text"
                          maxLength="4"
                          placeholder="Qty"
                          value={quantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-16 h-9 px-2 text-center text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button 
                          onClick={() => handleAdd(product)}
                          disabled={!quantities[product.id] || quantities[product.id] === '0'}
                          className="flex items-center justify-center h-9 w-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">No products found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
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