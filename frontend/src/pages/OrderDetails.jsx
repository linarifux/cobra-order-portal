import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, clearCurrentOrder } from '../store/slices/orderSlice';
import { 
  ArrowLeft, Package, MapPin, Truck, FileText, 
  Loader2, AlertCircle, Calendar, CreditCard
} from 'lucide-react';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentOrder: order, detailsStatus, error } = useSelector(state => state.orders);

  useEffect(() => {
    dispatch(fetchOrderById(id));
    
    // Cleanup on unmount
    return () => { dispatch(clearCurrentOrder()); };
  }, [dispatch, id]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Delivered':
      case 'Shipped': return 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 shadow-sm';
      case 'Processing':
      case 'Ready to Ship': return 'bg-blue-50/80 text-blue-700 border-blue-200/50 shadow-sm';
      case 'Cancelled': return 'bg-red-50/80 text-red-700 border-red-200/50 shadow-sm';
      case 'On Hold': return 'bg-gray-50/80 text-gray-700 border-gray-200/50 shadow-sm';
      default: return 'bg-amber-50/80 text-amber-700 border-amber-200/50 shadow-sm';
    }
  };

  if (detailsStatus === 'loading' || !order) {
    return (
      <div className="flex h-screen md:h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Retrieving Order Details...</p>
        </div>
      </div>
    );
  }

  if (detailsStatus === 'failed') {
    return (
      <div className="flex h-screen md:h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="flex w-full max-w-md flex-col items-center text-center animate-in fade-in p-6 sm:p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Order Not Found</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">{error}</p>
          <button 
            onClick={() => navigate('/orders')} 
            className="w-full sm:w-auto mt-6 sm:mt-8 px-6 py-2.5 bg-white/50 border border-white/80 rounded-xl shadow-sm text-blue-600 hover:bg-white hover:shadow-md transition-all font-bold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const ship = order.shippingDetails;

  return (
    <div className="relative max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 px-4 lg:px-0">
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-20 right-0 sm:right-10 w-64 h-64 sm:w-80 sm:h-80 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-60 left-0 sm:left-10 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 sm:pt-0">
        <div className="flex items-start sm:items-center gap-3 sm:gap-5">
          <button 
            onClick={() => navigate('/orders')}
            className="flex-shrink-0 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] mt-1 sm:mt-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 break-all sm:break-normal">
                {order.orderNumber}
              </h1>
              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Left Column: Info Cards */}
        <div className="flex-1 space-y-6 lg:space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Shipping Address Card */}
            <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col relative group">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
              <div className="border-b border-white/50 px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-3 bg-white/30 z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner flex-shrink-0">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Shipping Address</h2>
              </div>
              <div className="p-5 sm:p-6 flex-1 text-xs sm:text-sm text-gray-700 font-medium leading-relaxed z-10">
                <span className="block font-extrabold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{addr?.recipientName}</span>
                {addr?.line1} <br />
                {addr?.line2 && <>{addr.line2}<br /></>}
                {addr?.city}, {addr?.state} {addr?.zip} <br />
                {addr?.country}
              </div>
            </section>

            {/* Carrier Info Card */}
            <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col relative group">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
              <div className="border-b border-white/50 px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-3 bg-white/30 z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-100 to-teal-100 border border-white shadow-inner flex-shrink-0">
                  <Truck className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Carrier Details</h2>
              </div>
              <div className="p-5 sm:p-6 flex-1 space-y-4 text-sm z-10">
                <div>
                  <p className="text-gray-400 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-1">Service</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 bg-white/50 border border-white/80 px-3 py-2 rounded-xl shadow-sm inline-block break-words max-w-full">
                    {ship?.carrierType || 'Standard'} - {ship?.serviceCode || 'TBD'}
                  </p>
                </div>
                {ship?.trackingNumber && (
                  <div>
                    <p className="text-gray-400 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-1">Tracking Number</p>
                    <p className="text-xs sm:text-sm font-mono text-blue-600 font-bold bg-white/50 border border-white/80 px-3 py-2 rounded-xl shadow-sm inline-block cursor-pointer hover:bg-white hover:text-blue-700 transition-colors break-all max-w-full">
                      {ship.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Notes Section */}
          {order.notes && (
            <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative group">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
              <div className="border-b border-white/50 px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-3 bg-white/30 z-10 relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-100 to-orange-100 border border-white shadow-inner flex-shrink-0">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Order Notes & Details</h2>
              </div>
              <div className="p-5 sm:p-6 z-10 relative">
                <div className="bg-white/50 border border-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Line Items & Summary */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            
            {/* Dark Premium Header for Receipt */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-gray-900 text-white flex items-center justify-between shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight relative z-10">Receipt</h2>
              <span className="bg-white/10 border border-white/20 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-md relative z-10 shadow-sm">
                {order.items?.length || 0} Items
              </span>
            </div>
            
            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar border-b border-white/50 bg-white/20">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/60 border border-white/80 shadow-sm hover:bg-white/80 transition-colors">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-tr from-gray-100 to-white border border-white flex flex-shrink-0 items-center justify-center shadow-inner">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                  <div className="flex flex-col flex-1 justify-center min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate tracking-tight" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider mt-0.5">SKU: {item.sku}</p>
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 bg-white border border-gray-200 shadow-sm px-2 py-0.5 rounded-md">Qty: {item.quantity}</span>
                      <span className="text-xs sm:text-sm font-extrabold text-blue-600">
                        {formatMoney(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6 space-y-3 sm:space-y-4 text-xs sm:text-sm bg-white/40">
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">
                  {formatMoney((order.totalAmount || 0) - (ship?.shippingCost || 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Shipping Cost</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(ship?.shippingCost || 0)}
                </span>
              </div>
              <div className="pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-gray-200/60 flex justify-between items-end sm:items-center">
                <span className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">Total Charged</span>
                <span className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm leading-none">
                  {formatMoney(order.totalAmount)}
                </span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}