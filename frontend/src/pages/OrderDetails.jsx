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
      case 'Shipped': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'Processing':
      case 'Ready to Ship': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'Cancelled': return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'On Hold': return 'bg-gray-50 text-gray-700 ring-gray-600/20';
      default: return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    }
  };

  if (detailsStatus === 'loading' || !order) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-medium text-gray-600">Retrieving Order Details...</p>
        </div>
      </div>
    );
  }

  if (detailsStatus === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button onClick={() => navigate('/orders')} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const ship = order.shippingDetails;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{order.orderNumber}</h1>
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Info Cards */}
        <div className="flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2.5 bg-gray-50/50">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="p-5 flex-1 text-sm text-gray-600 leading-relaxed">
                <span className="block font-bold text-gray-900 mb-1 text-base">{addr?.recipientName}</span>
                {addr?.line1} <br />
                {addr?.line2 && <>{addr.line2}<br /></>}
                {addr?.city}, {addr?.state} {addr?.zip} <br />
                {addr?.country}
              </div>
            </section>

            {/* Carrier Info */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2.5 bg-gray-50/50">
                <Truck className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Carrier Details</h2>
              </div>
              <div className="p-5 flex-1 space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-0.5">Service</p>
                  <p className="font-medium text-gray-900">
                    {ship?.carrierType || 'Standard'} - {ship?.serviceCode || 'TBD'}
                  </p>
                </div>
                {ship?.trackingNumber && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-0.5">Tracking Number</p>
                    <p className="font-mono text-blue-600 font-medium">{ship.trackingNumber}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Notes Section */}
          {order.notes && (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2.5 bg-gray-50/50">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Order Notes & Details</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Line Items & Summary */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-semibold">Receipt</h2>
              <span className="bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {order.items?.length || 0} Items
              </span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-6 space-y-4 custom-scrollbar border-b border-gray-100">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-14 w-14 rounded-lg bg-gray-50 border border-gray-200 flex flex-shrink-0 items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                  <div className="flex flex-col flex-1 justify-center min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.sku}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatMoney(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 space-y-3 text-sm bg-gray-50/50">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatMoney((order.totalAmount || 0) - (ship?.shippingCost || 0))}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Cost</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(ship?.shippingCost || 0)}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total Charged</span>
                <span className="text-2xl font-bold text-blue-600">{formatMoney(order.totalAmount)}</span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}