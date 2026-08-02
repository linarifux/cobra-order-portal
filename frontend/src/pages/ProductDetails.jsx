import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { fetchInventoryById, clearCurrentInventoryItem } from '../store/slices/inventorySlice';
import { toast } from 'sonner';
import { 
  ArrowLeft, Package, ShoppingCart, Activity, 
  AlertCircle, CheckCircle2, Layers, MapPin, DollarSign, ActivitySquare, Loader2,
  Weight
} from 'lucide-react';

// Robust internal component to elegantly handle cached images, flashing, and error fallbacks
const DetailImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null); // Reference to check if image is already cached

  // Reset image states when a new product is loaded to prevent old images from flashing
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    // FIX: If the browser pulled the image from cache instantly, mark it as loaded
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-50 to-slate-100 z-10 rounded-3xl">
        <Package className="h-16 w-16 sm:h-24 sm:w-24 text-slate-300" />
        <p className="mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 text-center px-4">
          No Image Available
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white z-10 rounded-3xl p-6 sm:p-8">
      {!isLoaded && <Loader2 className="absolute animate-spin text-blue-500 h-8 w-8 z-20" />}
      <img 
        ref={imgRef}
        key={src} // Forces React to mount a fresh image tag on URL change
        src={src} 
        alt={alt || 'Product Image'} 
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain mix-blend-multiply transition-opacity duration-500 hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default function ProductDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Read the targeted single item state from the Redux store
  const { currentItem: rawProduct, status, error } = useSelector((state) => state.inventory);

  const [quantity, setQuantity] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch the specific product directly from DB on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchInventoryById(id));
    }
    
    // Cleanup prevents stale data from flashing when navigating to another product
    return () => {
      dispatch(clearCurrentInventoryItem());
    };
  }, [dispatch, id]);

  // Handle explicitly failed requests or 404s
  if (status === 'failed' || (!rawProduct && status === 'succeeded')) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24 animate-in fade-in bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl max-w-lg mx-auto mt-6 md:mt-12 px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight text-center">Product Not Found</h2>
        <p className="text-sm font-medium text-gray-500 mt-2 text-center">
          {error || `The SKU ${id} does not exist in the catalog or failed to load.`}
        </p>
        <button onClick={() => dispatch(fetchInventoryById(id))} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 underline">Try Again</button>
        <Link to="/products" className="mt-8 px-6 py-2.5 bg-white/50 border border-white/80 rounded-xl shadow-sm text-slate-700 hover:bg-white transition-all font-semibold">
          Return to Products
        </Link>
      </div>
    );
  }

  // --- Premium Skeleton Loader (Prevents Layout Glitching) ---
  if (status === 'loading' || (status === 'idle' && !rawProduct)) {
    return (
      <div className="relative max-w-5xl mx-auto space-y-4 md:space-y-6 px-4 sm:px-0 mt-6">
        <div className="flex gap-4 pb-2 animate-pulse">
          <div className="h-10 w-32 bg-slate-200/60 rounded-xl"></div>
          <div className="h-10 w-48 bg-slate-200/60 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 animate-pulse">
            <div className="aspect-square sm:aspect-video lg:aspect-square bg-white/40 border border-white/60 rounded-3xl"></div>
            <div className="h-40 bg-white/40 border border-white/60 rounded-3xl"></div>
          </div>
          <div className="lg:col-span-2 flex flex-col animate-pulse">
            <div className="h-[450px] bg-white/40 border border-white/60 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Bulletproof Fallback map block safely referencing the payload keys to prevent NaN crashes
  const product = rawProduct ? {
    sku: rawProduct.sku,
    _id: rawProduct._id, // Retain mongo ID internally if needed elsewhere
    image: rawProduct.productImage || rawProduct.image || null,
    desc: rawProduct.itemName || rawProduct.description || rawProduct.desc || 'Unknown Item',
    category: rawProduct.cat3 || rawProduct.cat2 || rawProduct.category1?.categoryName || rawProduct.category || 'General',
    status: rawProduct.status || 'Active',
    
    // Strict numeric casting to prevent UI crashes
    available: Number(rawProduct.available || rawProduct.unitsOnHand || 0),
    min: Number(rawProduct.safetyBuffer || rawProduct.min || 0),
    max: rawProduct.max || '-', 
    onOrder: Number(rawProduct.pipelineSupply || rawProduct.openOrders || rawProduct.onOrder || 0),
    price: Number(rawProduct.price || 0),
    cost: Number(rawProduct.unitCost || rawProduct.cost || rawProduct.price || 0),
    valuation: Number(rawProduct.totalValuation || ((rawProduct.price || 0) * (rawProduct.available || rawProduct.unitsOnHand || 0))),
    weight: Number(rawProduct.weight || 0)
  } : null;

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Robust check: Ensure the product actually has an SKU before adding to the cart
    if (!product.sku) {
      toast.error("Invalid Product", { description: "Cannot add an item without a valid SKU." });
      return;
    }

    const qty = parseInt(quantity, 10);
    
    if (qty > 0) {
      // Overwrite the traditional Mongo '_id' with 'sku' explicitly as the identifier for the cart slice
      const cartPayload = {
        ...product,
        id: product.sku
      };

      dispatch(addToCart({ product: cartPayload, quantity: qty }));
      
      setShowSuccess(true);
      toast.success(`Added to Queue`, { description: `${qty}x ${product.sku} successfully added.` });
      
      setTimeout(() => setShowSuccess(false), 3000);
      setQuantity('1'); 
    }
  };

  if (!product) return null;

  // Convert the total weight mapped above back into separated display integers
  const weightLbs = Math.floor(product.weight / 16);
  const weightOz = product.weight % 16;

  return (
    <div className="relative max-w-5xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700 px-4 sm:px-0 pb-12 pt-6">
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-80 h-80 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm pb-2 w-full overflow-hidden">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 font-semibold hover:text-gray-900 transition-all bg-white/40 backdrop-blur-md px-4 py-2 border border-white/60 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-white/60 w-max shrink-0"
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Catalog</span>
        </button>
        <div className="flex items-center gap-2 text-gray-400 font-semibold bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40 overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0">
          <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <span>/</span>
          {/* Fallback to displaying SKU over Mongo ID in the breadcrumb */}
          <span className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.sku || 'Unknown'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Image, Stats & Meta info */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          
          {/* Image Container */}
          <div className="aspect-square sm:aspect-video lg:aspect-square bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none z-0"></div>
            
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-blue-700 border border-white shadow-sm">
                {product.category}
              </span>
            </div>

            {/* Smart Image Loader */}
            <DetailImage src={product.image} alt={product.desc} />
          </div>

          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><Weight className="h-4 w-4"/> Unit Weight</span>
              <span className="font-mono font-bold text-gray-900 bg-white/50 px-2 py-1 rounded border border-white/60 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none text-right">
                {weightLbs} lb {weightOz} oz
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/50 pt-4">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><DollarSign className="h-4 w-4"/> Unit Price</span>
              <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/50 pt-4">
              <span className="flex items-center gap-2 text-gray-500 font-semibold"><ActivitySquare className="h-4 w-4"/> Lifecycle</span>
              <span className="font-bold text-gray-900 truncate ml-2 text-xs sm:text-sm uppercase tracking-wider">{product.status}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-10 flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="mb-8 sm:mb-10 relative z-10 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {product.desc}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm">
                <span className="font-mono font-bold text-gray-600 bg-white/50 border border-white/80 shadow-sm px-3 py-1.5 rounded-lg">
                  SKU: {product.sku || 'N/A'}
                </span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border shadow-sm ${product.available > 0 ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50' : 'bg-red-50/80 text-red-700 border-red-200/50'}`}>
                  {product.available > 0 ? <><CheckCircle2 className="h-4 w-4" /> In Stock</> : <><AlertCircle className="h-4 w-4" /> Out of Stock</>}
                </span>
              </div>
            </div>

            {/* Inventory Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-4 mb-8 sm:mb-10 relative z-10">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:bg-white/70 transition-colors">
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 mb-1.5 sm:mb-2">
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Available</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{product.available}</p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:bg-white/70 transition-colors">
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 mb-1.5 sm:mb-2">
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Min/Max</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{product.min} <span className="text-gray-400 font-semibold text-sm sm:text-lg">/ {product.max}</span></p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-blue-50/80 to-indigo-50/80 border border-blue-100/50 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 mb-1.5 sm:mb-2">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Total Val</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-blue-900 truncate">
                  ${product.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <hr className="border-white/50 mb-6 sm:mb-8 relative z-10" />

            {/* Action Area */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 sm:gap-5 relative z-10 p-5 sm:p-6 bg-white/30 rounded-3xl border border-white/40 shadow-inner">
              <div className="w-full sm:w-36 flex-shrink-0">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Order Qty</label>
                <input
                  type="text"
                  maxLength="4"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full h-12 sm:h-14 px-4 text-lg sm:text-xl font-bold text-center bg-white/70 border border-white/80 rounded-xl sm:rounded-2xl shadow-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={!quantity || Number(quantity) < 1 || !product.sku}
                className="w-full sm:flex-1 h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98]"
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" /> <span className="truncate">Added to Order</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" /> <span className="truncate">Add to Current Order</span>
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