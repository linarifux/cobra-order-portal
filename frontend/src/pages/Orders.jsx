import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Download, Filter, Loader2, AlertCircle, Search, ClipboardList } from 'lucide-react';
import { fetchOrders } from '../store/slices/orderSlice';

export default function Orders() {
  const dispatch = useDispatch();
  const { items: orders, status, error } = useSelector(state => state.orders);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchOrders());
    }
  }, [status, dispatch]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
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
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'Processing':
      case 'Ready to Ship':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'On Hold':
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
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

  if (status === 'loading' && orders.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-medium text-gray-600">Loading Orders...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Failed to load orders</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button onClick={() => dispatch(fetchOrders())} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track COBRA fulfillments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors flex-shrink-0">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link 
                        to={`/orders/${order._id}`} 
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-2 decoration-blue-200 hover:decoration-blue-600"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.shippingAddress?.recipientName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-900">No orders found</p>
                    <p className="text-sm text-gray-500 mt-1">Adjust your search filters or place a new order.</p>
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