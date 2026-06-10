import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { 
  ArrowLeft, Package, ShoppingCart, Activity, 
  AlertCircle, CheckCircle2, Layers, MapPin, DollarSign, ActivitySquare
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams(); // URL Param contains the SKU
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Read from the Redux store populated by the API
  const { items } = useSelector((state) => state.inventory);
  
  const [quantity, setQuantity] = useState('1');
  const [showSuccess, setShowSuccess] = useState(false);

  // Find the exact item from the raw API payload using the SKU
  const rawProduct = items.find(p => p.sku === id);

  if (!rawProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-gray-500 mt-2">The SKU {id} does not exist in the catalog or hasn't loaded.</p>
        <Link to="/products" className="mt-6 text-blue-600 hover:underline font-medium">
          Return to Products
        </Link>
      </div>
    );
  }

  // Format the raw data into standard properties for the UI
  const product = {
    id: rawProduct.sku,
    desc: rawProduct.itemName,
    available: rawProduct.unitsOnHand || 0,
    min: rawProduct.safetyBuffer || 0,
    max: '-', // API omission
    onOrder: rawProduct.pipelineSupply || 0,
    category: rawProduct.categories?.[0]?.categoryName || 'General',
    location: rawProduct.locationCoordinates || 'Unassigned',
    cost: rawProduct.unitCost || 0,
    valuation: rawProduct.totalValuation || 0,
    status: rawProduct.status || 'Unknown'
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    const qty = parseInt(quantity, 10);
    if (qty > 0) {
      dispatch(addToCart({ product, quantity: qty }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setQuantity('1'); // Reset
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-4 text-sm">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-gray-400 font-medium">
          <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Stats & Meta info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="aspect-square bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 relative overflow-hidden group">
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                {product.category}
              </span>
            </div>
            <Package className="h-32 w-32 text-gray-200 group-hover:scale-110 transition-transform duration-500" />
            <p className="mt-4 text-sm font-medium text-gray-400">No Image Available</p>
          </div>

          {/* Secondary Details Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500"><MapPin className="h-4 w-4"/> Location</span>
              <span className="font-mono font-medium text-gray-900">{product.location}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500"><DollarSign className="h-4 w-4"/> Unit Cost</span>
              <span className="font-medium text-gray-900">${product.cost}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-gray-500"><ActivitySquare className="h-4 w-4"/> Pool Status</span>
              <span className="font-medium text-gray-900 truncate ml-2">{product.status}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex-1">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {product.desc}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  SKU: {product.id}
                </span>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium ${product.available > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {product.available > 0 ? <><CheckCircle2 className="h-4 w-4" /> In Stock</> : <><AlertCircle className="h-4 w-4" /> Out of Stock</>}
                </span>
              </div>
            </div>

            {/* Inventory Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Available</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{product.available}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Min / Max</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{product.min} <span className="text-gray-400 font-medium text-lg">/ {product.max}</span></p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">On Order</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{product.onOrder}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Total Value</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">${product.valuation}</p>
              </div>
            </div>

            <hr className="border-gray-100 mb-8" />

            {/* Action Area */}
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-gray-700 mb-2">Order Quantity</label>
                <input
                  type="text"
                  maxLength="4"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full h-12 px-4 text-lg font-medium text-center border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={!quantity || quantity === '0'}
                className="w-full sm:flex-1 h-12 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl font-semibold shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {showSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Added to Order
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" /> Add to Current Order
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