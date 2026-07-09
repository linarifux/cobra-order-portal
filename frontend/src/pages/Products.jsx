import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventory } from '../store/slices/inventorySlice';
import { Loader2, AlertCircle } from 'lucide-react';

// Import our new modular components
import ProductSidebar from '../components/products/ProductSidebar';
import ProductHeader from '../components/products/ProductHeader';
import ProductTable from '../components/products/ProductTable';

export default function Products() {
  const dispatch = useDispatch();
  
  // Connect to Redux state modules
  const { items, status, error } = useSelector((state) => state.inventory);
  const activeDivision = useSelector((state) => state.divisions.activeDivision);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [quantities, setQuantities] = useState({});

  const divisionId = activeDivision?._id || activeDivision;

  // Fetch inventory
  useEffect(() => {
    if (divisionId) {
      dispatch(fetchInventory(divisionId));
    }
  }, [dispatch, divisionId]);

  // Derive Nested Categories
  const dynamicCategories = useMemo(() => {
    const categoryMap = {};
    
    items.forEach(item => {
      const itemDivisionId = item.division?._id || item.division;
      if (itemDivisionId !== divisionId) return;

      const divisionName = item.division?.divisionName || 'Uncategorized';
      const cat1 = item.category1?.categoryName || 'General';
      const cat2 = item.category2?.categoryName;
      const cat3 = item.category3?.categoryName;
      
      if (!categoryMap[divisionName]) categoryMap[divisionName] = {};
      if (!categoryMap[divisionName][cat1]) categoryMap[divisionName][cat1] = {};
      
      if (cat2) {
        if (!categoryMap[divisionName][cat1][cat2]) categoryMap[divisionName][cat1][cat2] = new Set();
        if (cat3) {
          categoryMap[divisionName][cat1][cat2].add(cat3);
        }
      }
    });

    return Object.entries(categoryMap).map(([division, cat1Map]) => {
      const categories = Object.entries(cat1Map).map(([cat1Name, cat2Map]) => {
        const children = Object.entries(cat2Map).map(([cat2Name, cat3Set]) => ({
          name: cat2Name,
          path: `${cat1Name}|${cat2Name}`,
          children: Array.from(cat3Set).map(cat3Name => ({ 
            name: cat3Name, 
            path: `${cat1Name}|${cat2Name}|${cat3Name}` 
          })).sort((a, b) => a.name.localeCompare(b.name))
        })).sort((a, b) => a.name.localeCompare(b.name));

        return { name: cat1Name, path: cat1Name, children };
      }).sort((a, b) => a.name.localeCompare(b.name));

      return { division, categories };
    }).sort((a, b) => a.division.localeCompare(b.division));
  }, [items, divisionId]);

  // Filter and Map Products
  const filteredProducts = useMemo(() => {
    const mapped = items
      .filter(item => {
        const itemDivisionId = item.division?._id || item.division;
        return itemDivisionId === divisionId;
      })
      .map(item => ({
        _id: item._id,
        id: item.sku || 'N/A', 
        image: item.productImage || null,
        desc: item.itemName || 'Unknown Item',
        min: item.safetyBuffer || item.min || 0,
        max: item.max || '-', 
        available: item.unitsOnHand || 0,
        onOrder: item.pipelineSupply || 0,
        cat1: item.category1?.categoryName || 'General',
        cat2: item.category2?.categoryName,
        cat3: item.category3?.categoryName,
        displayCategory: item.category1?.categoryName || 'General',
        price: item.price || 0,
        cost: item.unitCost || item.price || 0
      }));

    const finalFiltered = mapped.filter(product => {
      const matchesSearch = 
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || 
        product.cat1 === activeCategory || 
        product.cat2 === activeCategory || 
        product.cat3 === activeCategory;
        
      return matchesSearch && matchesCategory;
    });

    return finalFiltered.sort((a, b) => 
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [items, searchQuery, activeCategory, divisionId]);

  // Action Handlers
  const handleCategoryClick = (catName, path, hasChildren) => {
    setActiveCategory(catName);
    if (hasChildren) {
      setExpandedCategories(prev => ({ ...prev, [path]: !prev[path] }));
    }
  };

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

  // Render States
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
    // FIX: Using min-h on mobile so it can naturally stretch, but locking it to fixed h-[calc()] on md screens and above.
    <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 min-h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] pt-4 md:pt-6 animate-in fade-in duration-700">
      
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      <div className="w-full md:w-64 flex-shrink-0 max-h-[350px] md:max-h-full">
        <ProductSidebar 
          dynamicCategories={dynamicCategories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          expandedCategories={expandedCategories}
          handleCategoryClick={handleCategoryClick}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 min-h-[500px] bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full overflow-hidden">
        <ProductHeader 
          activeCategory={activeCategory}
          productCount={filteredProducts.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <ProductTable 
          products={filteredProducts}
          quantities={quantities}
          handleQuantityChange={handleQuantityChange}
          handleAdd={handleAdd}
        />
      </main>

    </div>
  );
}