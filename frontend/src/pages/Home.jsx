import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../store/slices/orderSlice';
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle, TrendingUp, Loader2, Shield } from 'lucide-react';

export default function Home() {
  const dispatch = useDispatch();
  
  // Extract user and active division context from Redux
  const { user } = useSelector((state) => state.auth);
  const activeDivision = useSelector((state) => state.divisions.activeDivision);
  const { items: orders, status: ordersStatus, error } = useSelector((state) => state.orders);

  // Safely extract the active division ID
  const divisionId = activeDivision?._id || activeDivision;

  // FIX: Fetch fresh orders explicitly scoped to the active division context
  useEffect(() => {
    if (divisionId) {
      dispatch(fetchOrders(divisionId));
    }
  }, [dispatch, divisionId]);

  // FIX: Client-side isolation to guarantee stats strictly reflect the current workspace
  const scopedOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const orderDivisionId = order.division?._id || order.division;
      return orderDivisionId === divisionId;
    });
  }, [orders, divisionId]);

  // Dynamically calculate order statistics based strictly on scoped items
  const orderStats = useMemo(() => {
    if (!scopedOrders || scopedOrders.length === 0) return { total: 0, pending: 0, synced: 0, errors: 0 };

    return {
      total: scopedOrders.length,
      pending: scopedOrders.filter(o => o.status === 'Pending').length,
      synced: scopedOrders.filter(o => ['Processing', 'Ready to Ship', 'Shipped', 'Delivered'].includes(o.status)).length,
      errors: scopedOrders.filter(o => ['Cancelled', 'On Hold'].includes(o.status)).length,
    };
  }, [scopedOrders]);

  const stats = [
    { 
      name: 'Total Orders', 
      value: orderStats.total.toLocaleString(), 
      icon: ArrowUpRight, 
      gradient: 'from-blue-600 to-indigo-500',
      shadow: 'shadow-blue-500/30',
      trend: '+12.5%'
    },
    { 
      name: 'Pending Sync', 
      value: orderStats.pending.toLocaleString(), 
      icon: Clock, 
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/30',
      trend: '-2.4%'
    },
    { 
      name: 'Synced to COBRA', 
      value: orderStats.synced.toLocaleString(), 
      icon: CheckCircle2, 
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/30',
      trend: '+18.2%'
    },
    { 
      name: 'Requires Attention', 
      value: orderStats.errors.toLocaleString(), 
      icon: AlertCircle, 
      gradient: 'from-rose-400 to-red-500',
      shadow: 'shadow-red-500/30',
      trend: '-1.1%'
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name || user?.firstName || 'User';

  return (
    <div className="relative space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Subtle Background Orbs to enhance the Glassmorphism */}
      <div className="absolute top-0 right-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 lg:pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900">
              {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{displayName}</span>
            </h1>
            {user?.role && (
              <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest border border-blue-200/50 shadow-sm backdrop-blur-md">
                <Shield className="h-3 w-3 shrink-0" />
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm lg:text-base font-medium text-gray-500">
            Here is what's happening with your DSM order operations today.
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/50 border border-white/60 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-md hover:bg-white/80 transition-all duration-300">
          <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" /> View Analytics
        </button>
      </div>

      {/* Glassmorphic Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="relative overflow-hidden rounded-2xl lg:rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 p-5 lg:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:bg-white/60 group"
          >
            <div className="flex items-start justify-between mb-3 lg:mb-4">
              <div className={`flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl lg:rounded-2xl bg-gradient-to-tr ${stat.gradient} text-white shadow-lg ${stat.shadow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
                <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 lg:px-2.5 lg:py-1 text-[10px] lg:text-xs font-semibold border ${stat.trend.startsWith('+') ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50' : 'bg-red-50/80 text-red-700 border-red-200/50'}`}>
                {stat.trend}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <p className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {ordersStatus === 'loading' ? <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-gray-400 mt-1" /> : stat.value}
                </p>
              </div>
              <p className="text-xs lg:text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{stat.name}</p>
            </div>

            <div className={`absolute -right-8 -top-8 h-24 w-24 lg:h-32 lg:w-32 rounded-full bg-gradient-to-tr ${stat.gradient} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20 pointer-events-none`}></div>
          </div>
        ))}
      </div>

      {/* Error Fallback Notice */}
      {ordersStatus === 'failed' && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-md p-4 border border-red-200/50 flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Failed to sync orders</h3>
            <p className="text-sm font-medium text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Recent Sync Activity Placeholder */}
      <div className="mt-6 lg:mt-8 rounded-2xl lg:rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 p-5 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-bold text-gray-900">Recent Sync Activity</h2>
          <button className="text-xs lg:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
        </div>
        <div className="flex h-32 lg:h-48 items-center justify-center rounded-xl lg:rounded-2xl border border-dashed border-gray-300 bg-white/30">
          <p className="text-xs lg:text-sm font-medium text-gray-500">Activity chart will render here</p>
        </div>
      </div>

    </div>
  );
}