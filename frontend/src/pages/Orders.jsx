import { Download, Filter, MoreVertical } from 'lucide-react';

// Mock data - eventually this will come from your Redux store
const mockOrders = [
  { id: 'DSM-1042', date: 'Oct 24, 2026', customer: 'Alex Johnson', total: '$124.00', status: 'Pending' },
  { id: 'DSM-1041', date: 'Oct 24, 2026', customer: 'Sarah Smith', total: '$89.50', status: 'Synced' },
  { id: 'DSM-1040', date: 'Oct 23, 2026', customer: 'Michael Chen', total: '$210.00', status: 'Synced' },
  { id: 'DSM-1039', date: 'Oct 23, 2026', customer: 'Emma Davis', total: '$45.00', status: 'Failed' },
];

export default function Orders() {
  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      Synced: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      Failed: 'bg-red-50 text-red-700 ring-red-600/20',
    };
    return `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and push order data to the COBRA system.</p>
        </div>
        <div className="mt-4 flex gap-3 sm:mt-0">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Download className="h-4 w-4" /> Export for COBRA
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COBRA Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {mockOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">{order.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{order.customer}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.total}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}