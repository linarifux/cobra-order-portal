import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Download, Loader2, AlertCircle, Search, ClipboardList } from 'lucide-react';
import { fetchOrders } from '../store/slices/orderSlice';

export default function Orders() {
  const dispatch = useDispatch();
  
  // Extract user context from Redux auth slice
  const { user } = useSelector(state => state.auth);
  const { items: orders, status, error } = useSelector(state => state.orders);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Safely grab dynamic customer context from session
  const customerId = user?.customer;

  // FIX: Fetch fresh orders on every component mount whenever the session context is verified
  useEffect(() => {
    if (customerId) {
      dispatch(fetchOrders(customerId));
    }
  }, [dispatch, customerId]);

  // Sort and filter orders completely in client-side memo layer
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    // FIX: Clone and sort array to guarantee most recent transactions appear at the very top
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sorted.filter(order => {
      const query = searchQuery.toLowerCase();
      return (
        (order.orderNumber || '').toLowerCase().includes(query) ||
        (order.shippingAddress?.recipientName || '').toLowerCase().includes(query) ||
        (order.status || '').toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Delivered':
      case 'Shipped':
        return 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 shadow-sm';
      case 'Processing':
      case 'Ready to Ship':
        return 'bg-blue-50/80 text-blue-700 border-blue-200/50 shadow-sm';
      case 'Cancelled':
        return 'bg-red-50/80 text-red-700 border-red-200/50 shadow-sm';
      case 'On Hold':
        return 'bg-gray-50/80 text-gray-700 border-gray-200/50 shadow-sm';
      case 'Pending':
      default:
        return 'bg-amber-50/80 text-amber-700 border-amber-200/50 shadow-sm';
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // --- Loader States ---
  if (status === 'loading' && orders.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Syncing Orders...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Failed to load orders</h2>
          <p className="text-gray-500 mt-2 font-medium">{error}</p>
          <button 
            onClick={() => customerId && dispatch(fetchOrders(customerId))} 
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-in fade-in duration-700">
      
      {/* Subtle Background Decorative Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Premium Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            Order Operations
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 ml-14">Manage and track COBRA fulfillments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] flex-shrink-0">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Glassmorphic Data Table */}
      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-white/40">
            <thead className="bg-white/60 backdrop-blur-md">
              <tr>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Order ID</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Date</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Recipient</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Total</th>
                <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-white/60 transition-colors duration-200 group">
                    <td className="whitespace-nowrap px-8 py-5">
                      <Link 
                        to={`/orders/${order._id}`} 
                        className="text-sm font-bold text-blue-600 hover:text-indigo-600 transition-colors underline-offset-4 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-sm font-medium text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-8 py-5">
                      <div className="text-sm font-bold text-gray-900">{order.shippingAddress?.recipientName || 'N/A'}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-sm font-extrabold text-gray-900">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-sm">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white/60">
                        <ClipboardList className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">No orders found</p>
                      <p className="text-sm font-medium text-gray-500 mt-1">Adjust your search filters or place a new order.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}