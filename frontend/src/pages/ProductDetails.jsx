import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventory } from '../store/slices/inventorySlice'; // <-- Added back for sync hydration on route reloads
import { 
  ArrowLeft, Package, ShoppingCart, Activity, 
  AlertCircle, CheckCircle2, Layers, MapPin, DollarSign, ActivitySquare, Loader2
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Read from the Redux store populated by the API
  const { user } = useSelector((state) => state.auth);
  const { items, status, error } = useSelector((state) => state.inventory);

  const [quantity, setQuantity] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);

  const customerId = user?.customer;

  // FIX: Resilient hydration fallback. If a user hits refresh on this URL directly, Redux clears. 
  // This re-triggers inventory sync immediately if the cache collection is empty.
  useEffect(() => {
    if (items.length === 0 && customerId) {
      dispatch(fetchInventory(customerId));
    }
  }, [dispatch, items.length, customerId]);

  // Find the exact item from the raw API payload using the SKU
  const rawProduct = items.find(p => p.sku === id);

  // Render full glass loader during network synchronization
  if (status === 'loading') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Retrieving SKU Data profile...</p>
        </div>
      </div>
    );
  }

  if (!rawProduct && status === 'succeeded') {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl max-w-lg mx-auto mt-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Product Not Found</h2>
        <p className="text-sm font-medium text-gray-500 mt-2 text-center px-6">The SKU {id} does not exist in the catalog or hasn't loaded.</p>
        <Link to="/products" className="mt-8 px-6 py-2.5 bg-white/50 border border-white/80 rounded-xl shadow-sm text-blue-600 hover:bg-white transition-all font-semibold">
          Return to Products
        </Link>
      </div>
    );
  }

  // Fallback map block safely referencing the verified payload keys if initialized
  const product = rawProduct ? {
    id: rawProduct.sku,
    desc: rawProduct.itemName,
    available: rawProduct.unitsOnHand || 0,
    min: rawProduct.safetyBuffer || rawProduct.min || 0,
    max: rawProduct.max || '-', 
    onOrder: rawProduct.pipelineSupply || 0,
    category: rawProduct.category1?.categoryName || 'General', // FIX: Safely map category tracking to schema update
    location: rawProduct.locationCoordinates || 'Unassigned',
    price: rawProduct.price || 0,
    cost: rawProduct.unitCost || rawProduct.price || 0,
    unitCost: rawProduct.unitCost || rawProduct.price || 0,
    valuation: rawProduct.totalValuation || 0,
    status: rawProduct.status || 'Unknown'
  } : null;

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const qty = parseInt(quantity, 10);
    if (qty > 0) {
      dispatch(addToCart({ product, quantity: qty }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setQuantity('1'); 
    }
  };

  if (!product) return null;

  return (
    <div className="relative max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-80 h-80 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-4 text-sm pb-2">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 font-semibold hover:text-gray-900 transition-all bg-white/40 backdrop-blur-md px-4 py-2 border border-white/60 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-white/60"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </button>
        <div className="flex items-center gap-2 text-gray-400 font-semibold bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40">
          <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Stats & Meta info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="aspect-square bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
            <div className="absolute top-5 left-5 z-10">
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/60 backdrop-blur-md text-blue-700 border border-white shadow-sm">
                {product.category}
              </span>
            </div>
            <div className="relative h-32 w-32 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-gray-100 to-white border border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400 relative z-10">No Image Available</p>
          </div>

          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 space-y-5">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><MapPin className="h-4 w-4"/> Location</span>
              <span className="font-mono font-bold text-gray-900 bg-white/50 px-2 py-1 rounded border border-white/60">{product.location}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><DollarSign className="h-4 w-4"/> Price</span>
              <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><ActivitySquare className="h-4 w-4"/> Pool Status</span>
              <span className="font-bold text-gray-900 truncate ml-2">{product.status}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="mb-10 relative z-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {product.desc}
              </h1>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="font-mono font-bold text-gray-600 bg-white/50 border border-white/80 shadow-sm px-3 py-1.5 rounded-lg">
                  SKU: {product.id}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border shadow-sm ${product.available > 0 ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50' : 'bg-red-50/80 text-red-700 border-red-200/50'}`}>
                  {product.available > 0 ? <><CheckCircle2 className="h-4 w-4" /> In Stock</> : <><AlertCircle className="h-4 w-4" /> Out of Stock</>}
                </span>
              </div>
            </div>

            {/* Inventory Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 relative z-10">
              <div className="p-5 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:bg-white/70 transition-colors">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Available</span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{product.available}</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:bg-white/70 transition-colors">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Min / Max</span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{product.min} <span className="text-gray-400 font-semibold text-lg">/ {product.max}</span></p>
              </div>
              <div className="p-5 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:bg-white/70 transition-colors">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">On Order</span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{product.onOrder}</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-blue-50/80 to-indigo-50/80 border border-blue-100/50 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Value</span>
                </div>
                <p className="text-3xl font-extrabold text-blue-900">${Number(product.valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <hr className="border-white/50 mb-8 relative z-10" />

            {/* Action Area */}
            <div className="flex flex-col sm:flex-row items-end gap-5 relative z-10 p-6 bg-white/30 rounded-3xl border border-white/40 shadow-inner">
              <div className="w-full sm:w-36">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Order Qty</label>
                <input
                  type="text"
                  maxLength="4"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full h-14 px-4 text-xl font-bold text-center bg-white/70 border border-white/80 rounded-2xl shadow-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={!quantity || quantity === '0'}
                className="w-full sm:flex-1 h-14 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98]"
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="h-6 w-6" /> Added to Order
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6" /> Add to Current Order
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}