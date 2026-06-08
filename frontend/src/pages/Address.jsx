import { useState, useMemo } from 'react';
import { 
  MapPin, Plus, Search, Edit2, Trash2, 
  Building2, Phone, Mail, X, Map 
} from 'lucide-react';

// --- Mock Data ---
const INITIAL_ADDRESSES = [
  {
    id: 'adr_1',
    name: 'Alex Johnson',
    company: 'TechFlow Diagnostics',
    street: '1240 Innovation Way, Suite 200',
    city: 'Boston',
    state: 'MA',
    zip: '02110',
    phone: '(617) 555-0198',
    email: 'alex.j@techflow.com'
  },
  {
    id: 'adr_2',
    name: 'Sarah Smith',
    company: 'Radiant Imaging Centers',
    street: '8900 Medical Center Dr',
    city: 'Houston',
    state: 'TX',
    zip: '77030',
    phone: '(713) 555-4432',
    email: 'ssmith@radiantimaging.org'
  },
  {
    id: 'adr_3',
    name: 'Michael Chen',
    company: 'Pacific Health Logistics',
    street: '400 Broad Street',
    city: 'Seattle',
    state: 'WA',
    zip: '98109',
    phone: '(206) 555-7761',
    email: 'mchen@pacifichealth.net'
  }
];

const EMPTY_FORM = {
  name: '', company: '', street: '', city: '', state: '', zip: '', phone: '', email: ''
};

export default function Address() {
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Filter Logic
  const filteredAddresses = useMemo(() => {
    return addresses.filter(addr => {
      const query = searchQuery.toLowerCase();
      return (
        addr.name.toLowerCase().includes(query) ||
        addr.company.toLowerCase().includes(query) ||
        addr.city.toLowerCase().includes(query)
      );
    });
  }, [addresses, searchQuery]);

  // Form Handlers
  const openModal = (address = null) => {
    if (address) {
      setFormData(address);
      setEditingId(address.id);
    } else {
      setFormData(EMPTY_FORM);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingId) {
      // Update existing
      setAddresses(prev => prev.map(addr => addr.id === editingId ? { ...formData, id: editingId } : addr));
    } else {
      // Create new
      const newAddress = { ...formData, id: `adr_${Date.now()}` };
      setAddresses(prev => [newAddress, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Address Book</h1>
          <p className="mt-1 text-sm text-gray-500">Manage shipping destinations for downstream COBRA routing.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search customers or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 bg-white text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> 
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Address Grid */}
      {filteredAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredAddresses.map((addr) => (
            <div key={addr.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Card Header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                    {addr.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{addr.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{addr.company}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions (Visible on hover for desktop) */}
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(addr)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Address"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    {addr.street}<br />
                    {addr.city}, {addr.state} {addr.zip}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>{addr.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{addr.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-24">
          <Map className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-base font-medium text-gray-900">No addresses found</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4 text-center">We couldn't find any customers matching your search.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Customer Address' : 'Add New Customer'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Alex Johnson" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input required type="text" name="company" value={formData.company} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="TechFlow Diagnostics" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <input required type="text" name="street" value={formData.street} onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="1240 Innovation Way, Suite 200" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Boston" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="MA" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input required type="text" name="zip" value={formData.zip} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="02110" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="(555) 555-5555" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="contact@company.com" />
                  </div>
                </div>

              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
}