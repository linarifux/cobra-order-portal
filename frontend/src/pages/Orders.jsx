import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Download, Loader2, AlertCircle, Search, ClipboardList } from 'lucide-react';
import { fetchOrders } from '../store/slices/orderSlice';

export default function Orders() {
  const dispatch = useDispatch();
  
  // Extract user context from Redux auth slice and active division
  const { user } = useSelector(state => state.auth);
  const activeDivision = useSelector((state) => state.divisions.activeDivision);
  const { items: orders, status, error } = useSelector(state => state.orders);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Extract the active division ID from the Redux selection context safely
  const divisionId = activeDivision?._id || activeDivision;

  // Fetch fresh orders on every component mount, explicitly scoped to the active division context
  useEffect(() => {
    // Ensuring we only dispatch if there's a valid division scope preventing cross-tenant leakage
    if (divisionId) {
      dispatch(fetchOrders(divisionId));
    }
  }, [dispatch, divisionId]);

  // Sort and filter orders completely in client-side memo layer
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    // Filter array to strictly guarantee that ONLY orders assigned to the ACTIVE DIVISION appear
    const scopedOrders = orders.filter(order => {
      const orderDivisionId = order.division?._id || order.division;
      return orderDivisionId === divisionId;
    });

    // Clone and sort array to guarantee most recent transactions appear at the very top
    const sorted = [...scopedOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sorted.filter(order => {
      const query = searchQuery.toLowerCase();
      return (
        (order.orderNumber || '').toLowerCase().includes(query) ||
        (order.shippingAddress?.recipientName || '').toLowerCase().includes(query) ||
        (order.status || '').toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery, divisionId]);

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
          <p className="font-bold tracking-tight text-gray-600">Syncing Division Orders...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="flex w-full max-w-md flex-col items-center text-center animate-in fade-in p-6 sm:p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Failed to load orders</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">{error}</p>
          <button 
            onClick={() => divisionId && dispatch(fetchOrders(divisionId))} 
            className="mt-6 rounded-xl w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-bold transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-in fade-in duration-700 px-4 sm:px-0">
      
      {/* Subtle Background Decorative Orbs */}
      <div className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Premium Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner shrink-0">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            Order Operations
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-500 ml-11 sm:ml-14">Manage and track COBRA fulfillments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:flex-1 lg:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] flex-shrink-0">
            <Download className="h-4 w-4" /> <span>Export</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW: Stacked Glassmorphic Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-white/60 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/60 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <Link 
                  to={`/orders/${order._id}`} 
                  className="text-sm font-extrabold text-blue-600 hover:text-indigo-600 underline-offset-4 hover:underline tracking-tight"
                >
                  {order.orderNumber}
                </Link>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 border-b border-white/50 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date Created</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Value</p>
                  <p className="text-sm font-extrabold text-gray-900">{formatMoney(order.totalAmount)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Recipient Destination</p>
                <div className="text-sm font-bold text-gray-900">{order.shippingAddress?.recipientName || 'N/A'}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 py-12 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="h-14 w-14 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white/60">
              <ClipboardList className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-900">No orders found</p>
            <p className="text-xs font-medium text-gray-500 mt-1">Adjust your search filters.</p>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW: Glassmorphic Data Table */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-white/40">
            <thead className="bg-white/60 backdrop-blur-md">
              <tr>
                <th scope="col" className="px-6 lg:px-8 py-4 lg:py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Order ID</th>
                <th scope="col" className="px-6 lg:px-8 py-4 lg:py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Date</th>
                <th scope="col" className="px-6 lg:px-8 py-4 lg:py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Recipient</th>
                <th scope="col" className="px-6 lg:px-8 py-4 lg:py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Total</th>
                <th scope="col" className="px-6 lg:px-8 py-4 lg:py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-white/60 transition-colors duration-200 group">
                    <td className="whitespace-nowrap px-6 lg:px-8 py-4 lg:py-5">
                      <Link 
                        to={`/orders/${order._id}`} 
                        className="text-sm font-bold text-blue-600 hover:text-indigo-600 transition-colors underline-offset-4 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 lg:px-8 py-4 lg:py-5 text-sm font-medium text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 lg:px-8 py-4 lg:py-5">
                      <div className="text-sm font-bold text-gray-900">{order.shippingAddress?.recipientName || 'N/A'}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 lg:px-8 py-4 lg:py-5 text-sm font-extrabold text-gray-900">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 lg:px-8 py-4 lg:py-5 text-sm">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 lg:px-8 py-16 lg:py-20 text-center">
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