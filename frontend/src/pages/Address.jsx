import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MapPin, Plus, Search, Edit2, Trash2, 
  Phone, Mail, X, Map, Loader2, AlertCircle, Star, Tag, Check, Users
} from 'lucide-react';

import { 
  fetchAddressesByCustomer, 
  createAddress, 
  updateAddress, 
  deleteAddress 
} from '../store/slices/addressSlice'; 

// Strictly matching the updated Schema
const EMPTY_FORM = {
  firstName: '', 
  lastName: '',
  contactPhone: '', 
  contactEmail: '', 
  street1: '', 
  street2: '', 
  city: '', 
  state: '', 
  zipCode: '', 
  country: 'USA',
  addressType: 'Shipping',
  isDefault: false
};

const CUSTOMER_ID = '6a266dc144c2698dcc55390c';

export default function Address() {
  const dispatch = useDispatch();
  
  const { items: addresses, status, error } = useSelector((state) => state.addresses);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAddressesByCustomer(CUSTOMER_ID));
    }
  }, [status, dispatch]);

  const filteredAddresses = useMemo(() => {
    if (!addresses) return [];
    return addresses.filter(addr => {
      const query = searchQuery.toLowerCase();
      const fullName = `${addr.firstName || ''} ${addr.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (addr.city || '').toLowerCase().includes(query) ||
        (addr.addressType || '').toLowerCase().includes(query)
      );
    });
  }, [addresses, searchQuery]);

  const openModal = (address = null) => {
    if (address) {
      setFormData({
        ...EMPTY_FORM,
        ...address // Spread to ensure all keys exist even if missing from db
      });
      setEditingId(address._id);
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
    setIsSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      customer: CUSTOMER_ID
    };

    try {
      if (editingId) {
        await dispatch(updateAddress({ id: editingId, addressData: payload })).unwrap();
      } else {
        await dispatch(createAddress(payload)).unwrap();
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save address:', err);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddress(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete address:', err);
      }
    }
  };

  // --- Render States ---
  if (status === 'loading' && addresses.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Loading Address Book...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in p-8 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Failed to load addresses</h2>
          <p className="text-gray-500 mt-2 font-medium">{error}</p>
          <button 
            onClick={() => dispatch(fetchAddressesByCustomer(CUSTOMER_ID))}
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
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            Address Book
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 ml-14">Manage shipping destinations for downstream COBRA routing.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, city, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] flex-shrink-0"
          >
            <Plus className="h-5 w-5" /> 
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Glassmorphic Address Grid */}
      {filteredAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAddresses.map((addr) => (
            <div key={addr._id} className="relative flex flex-col rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/60 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden group">
              
              {/* Optional glow for active/default */}
              {addr.isDefault && (
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400 opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20"></div>
              )}

              {/* Card Header */}
              <div className="flex items-start justify-between p-6 border-b border-white/50 bg-white/30 relative z-10">
                
                {/* Default Badge */}
                {addr.isDefault && (
                  <div className="absolute top-0 right-0 rounded-bl-2xl bg-amber-100/80 backdrop-blur-sm px-4 py-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-l border-amber-200/50">
                    <Star className="h-3 w-3" fill="currentColor" /> Default
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white text-blue-700 font-extrabold uppercase shadow-inner text-lg">
                    {addr.firstName ? addr.firstName.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight">{addr.firstName} {addr.lastName}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{addr.addressType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <button 
                    onClick={() => openModal(addr)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/50 border border-white/60 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                    title="Edit Address"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(addr._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/50 border border-white/60 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 hover:shadow-sm transition-all"
                    title="Delete Address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col gap-4 relative z-10">
                <div className="flex items-start gap-3 text-sm font-medium text-gray-600">
                  <MapPin className="h-4 w-4 text-blue-500/70 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    <span className="text-gray-900">{addr.street1}</span>
                    {addr.street2 && <><br />{addr.street2}</>}
                    <br />
                    {addr.city}, {addr.state} {addr.zipCode}
                    <br />
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">{addr.country}</span>
                  </span>
                </div>
                {addr.contactPhone && (
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Phone className="h-4 w-4 text-blue-500/70 flex-shrink-0" />
                    <span>{addr.contactPhone}</span>
                  </div>
                )}
                {addr.contactEmail && (
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Mail className="h-4 w-4 text-blue-500/70 flex-shrink-0" />
                    <span className="truncate" title={addr.contactEmail}>{addr.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl py-24 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="h-20 w-20 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/60">
            <Map className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No addresses found</h2>
          <p className="text-sm font-medium text-gray-500 mt-2 mb-6 text-center">We couldn't find any customers matching your search.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-white/50 px-6 py-2.5 rounded-xl border border-white/80 shadow-sm transition-all"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Add/Edit Premium Glass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Changed to flex-col and max-h-full so the body scrolls but the modal itself never touches the edges */}
          <div className="bg-white/90 backdrop-blur-3xl backdrop-saturate-150 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white w-full max-w-lg max-h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-gray-200/50 bg-white/40">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {editingId ? 'Edit Customer Address' : 'Add New Address'}
              </h2>
              <button 
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50 border border-white text-gray-500 hover:text-gray-900 hover:bg-white shadow-sm transition-all focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">First Name <span className="text-red-500">*</span></label>
                    <input required type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="Alex" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Last Name <span className="text-red-500">*</span></label>
                    <input required type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="Johnson" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Contact Phone</label>
                    <input type="tel" name="contactPhone" value={formData.contactPhone || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="(555) 555-5555" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Contact Email</label>
                    <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="alex@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Street 1 <span className="text-red-500">*</span></label>
                    <input required type="text" name="street1" value={formData.street1 || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="1240 Innovation Way" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Street 2 <span className="normal-case tracking-normal font-medium text-gray-400">(Apt, Suite)</span></label>
                    <input type="text" name="street2" value={formData.street2 || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="Suite 200" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">City <span className="text-red-500">*</span></label>
                    <input required type="text" name="city" value={formData.city || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="Boston" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">State <span className="text-red-500">*</span></label>
                    <input required type="text" name="state" value={formData.state || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="MA" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">ZIP Code <span className="text-red-500">*</span></label>
                    <input required type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="02110" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-gray-200/50 pt-5 mt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Country</label>
                    <input type="text" name="country" value={formData.country || ''} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner" 
                      placeholder="USA" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Address Type</label>
                    <select name="addressType" value={formData.addressType} onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-white bg-white/50 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner appearance-none"
                    >
                      <option value="Shipping">Shipping</option>
                      <option value="Billing">Billing</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-300 ${formData.isDefault ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white/50 border-gray-300 group-hover:border-blue-500 group-hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        name="isDefault" 
                        checked={formData.isDefault} 
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      {formData.isDefault && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-gray-900 select-none">Set as Default Address</span>
                  </label>
                  <p className="text-xs font-medium text-gray-500 mt-1.5 ml-9">This will remove the default status from other addresses.</p>
                </div>

              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-200/50 bg-white/40">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-bold text-gray-700 bg-white/50 border border-white hover:bg-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
}