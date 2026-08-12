import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventory } from '../store/slices/inventorySlice';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Import our modular components
import ProductSidebar from '../components/products/ProductSidebar';
import ProductHeader from '../components/products/ProductHeader';
import ProductTable from '../components/products/ProductTable';

export default function Products() {
  const dispatch = useDispatch();
  
  // Connect to Redux state modules safely
  const { items = [], status, error } = useSelector((state) => state.inventory || {});
  const activeDivisionRaw = useSelector((state) => state.divisions?.activeDivision);
  
  
  // Robustly extract the string ID regardless of whether Redux holds an object or a string
  const divisionId = typeof activeDivisionRaw === 'object' && activeDivisionRaw !== null 
    ? activeDivisionRaw._id 
    : activeDivisionRaw;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryPath, setActiveCategoryPath] = useState('All'); // FIX: Added strict path tracking
  const [activeCategoryDisplay, setActiveCategoryDisplay] = useState('All'); // Used for display logic
  const [expandedCategories, setExpandedCategories] = useState({});
  const [quantities, setQuantities] = useState({});

  // Fetch inventory when division context changes
  useEffect(() => {
    if (divisionId) {
      dispatch(fetchInventory(divisionId));
    }
  }, [dispatch, divisionId]);


  // Derive Nested Categories with defensive Object/String checks
  const dynamicCategories = useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    const categoryMap = {};
    
    items.forEach(item => {
      const itemDivisionId = item.division?._id || item.division;
      if (itemDivisionId !== divisionId) return;

      const divisionName = item.division?.divisionName || (typeof item.division === 'string' ? item.division : 'Uncategorized');
      
      const cat1 = item.category1?.categoryName || (typeof item.category1 === 'string' ? item.category1 : 'General');
      const cat2 = item.category2?.categoryName || (typeof item.category2 === 'string' ? item.category2 : null);
      const cat3 = item.category3?.categoryName || (typeof item.category3 === 'string' ? item.category3 : null);
      
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

  // Filter and Map Products with robust fallback values
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(items)) return [];

    const mapped = items
      .filter(item => {
        const itemDivisionId = item.division?._id || item.division;
        return itemDivisionId === divisionId;
      })
      .map(item => ({
        ...item, // Spreading item guarantees the sync logic receives DB variables like 'itemName'
        _id: item._id,
        id: item.sku || item.productCode || 'N/A', 
        sku: item.sku || item.productCode || 'N/A', 
        image: item.productImage || item.image || null,
        desc: item.itemName || item.description || 'Unknown Item',
        itemName: item.itemName || item.description || 'Unknown Item',
        weight: item.weight || 0,
        min: item.safetyBuffer || item.min || 0,
        max: item.max || '-', 
        available: item.available || item.unitsOnHand || 0,
        onOrder: item.pipelineSupply || item.openOrders || item.onOrder || 0,
        cat1: item.category1?.categoryName || (typeof item.category1 === 'string' ? item.category1 : 'General'),
        cat2: item.category2?.categoryName || (typeof item.category2 === 'string' ? item.category2 : null),
        cat3: item.category3?.categoryName || (typeof item.category3 === 'string' ? item.category3 : null),
        displayCategory: item.category1?.categoryName || (typeof item.category1 === 'string' ? item.category1 : 'General'),
        price: item.price || item.unitCost || item.cost || 0,
        cost: item.unitCost || item.cost || item.price || 0
      }));
      
    const finalFiltered = mapped.filter(product => {
      const matchesSearch = 
        product.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // FIX: Check exact path alignment to isolate identical sub-categories
      let matchesCategory = false;
      if (activeCategoryPath === 'All') {
        matchesCategory = true;
      } else {
        const productPathParts = [product.cat1, product.cat2, product.cat3].filter(Boolean);
        const filterPathParts = activeCategoryPath.split('|');
        
        // Ensure the product's path matches the selected filter path completely
        matchesCategory = filterPathParts.every((part, i) => productPathParts[i] === part);
      }
        
      return matchesSearch && matchesCategory;
    });

    return finalFiltered.sort((a, b) => 
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [items, searchQuery, activeCategoryPath, divisionId]);

  // FIX: Destructure path logic for sidebar tracking
  const handleCategoryClick = (path, identifierPath, hasChildren) => {
    setActiveCategoryPath(identifierPath);
    // Extract just the name from the path string to use for the header title display
    const name = identifierPath.split('|').pop();
    setActiveCategoryDisplay(name);

    if (hasChildren) {
      setExpandedCategories(prev => ({ ...prev, [identifierPath]: !prev[identifierPath] }));
    }
  };

  const handleQuantityChange = (id, value) => {
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setQuantities(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAdd = (product) => {
    const qty = parseInt(quantities[product.id] || 0, 10);
    
    // Evaluate if the entered quantity exceeds the product's maximum limit
    const maxLimit = Number(product.max) || 0;
    const qtyLimitExceeds = maxLimit > 0 && qty > maxLimit;

    if (qty > 0) {
      // Dispatch the flag into the cart payload
      dispatch(addToCart({ product, quantity: qty, qtyLimitExceeds }));
      setQuantities(prev => ({ ...prev, [product.id]: '' }));
      toast.success(`Added ${qty} unit${qty > 1 ? 's' : ''} to order queue`);
    }
  };

  if (status === 'loading' || !divisionId) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Syncing Division Catalog...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="flex w-full max-w-md flex-col items-center text-center animate-in fade-in p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Failed to load catalog</h2>
          <p className="text-sm font-medium text-gray-500 mt-2">{error}</p>
          <button 
            onClick={() => divisionId && dispatch(fetchInventory(divisionId))}
            className="w-full sm:w-auto mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 min-h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)] pt-4 md:pt-6 animate-in fade-in duration-700 px-4 xl:px-0">
      
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      <div className="w-full md:w-64 flex-shrink-0 max-h-[350px] md:max-h-full">
        <ProductSidebar 
          dynamicCategories={dynamicCategories}
          activeCategory={activeCategoryPath}
          setActiveCategory={(val) => {
            setActiveCategoryPath(val);
            setActiveCategoryDisplay(val);
          }}
          expandedCategories={expandedCategories}
          handleCategoryClick={handleCategoryClick}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 min-h-[500px] bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-full overflow-hidden">
        <ProductHeader 
          activeCategory={activeCategoryDisplay}
          productCount={filteredProducts.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <ProductTable 
          products={filteredProducts}
          quantities={quantities}
          handleQuantityChange={handleQuantityChange}
          handleAdd={handleAdd}
          isLoading={status === 'loading'}
          onRefresh={() => divisionId && dispatch(fetchInventory(divisionId))}
        />
      </main>

    </div>
  );
}