import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MapPin, Plus, Search, Edit2, Trash2, 
  Phone, Mail, X, Map, Loader2, AlertCircle, Star, Tag, Check
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
    // Handle checkbox for isDefault separately
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
          <p className="font-medium text-gray-600">Loading Address Book...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center animate-in fade-in">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Failed to load addresses</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button 
            onClick={() => dispatch(fetchAddressesByCustomer(CUSTOMER_ID))}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              placeholder="Search by name, city, or type..."
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
            <div key={addr._id} className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Card Header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/50 relative">
                
                {/* Default Badge */}
                {addr.isDefault && (
                  <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <Star className="h-3 w-3" fill="currentColor" /> Default
                  </div>
                )}

                <div className="flex items-center gap-3 mt-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                    {addr.firstName ? addr.firstName.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{addr.firstName} {addr.lastName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{addr.addressType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <button 
                    onClick={() => openModal(addr)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Address"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(addr._id)}
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
                    {addr.street1}
                    {addr.street2 && <><br />{addr.street2}</>}
                    <br />
                    {addr.city}, {addr.state} {addr.zipCode}
                    <br />
                    <span className="text-gray-400">{addr.country}</span>
                  </span>
                </div>
                {addr.contactPhone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{addr.contactPhone}</span>
                  </div>
                )}
                {/* Displaying the Email on the Card */}
                {addr.contactEmail && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate" title={addr.contactEmail}>{addr.contactEmail}</span>
                  </div>
                )}
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
                {editingId ? 'Edit Customer Address' : 'Add New Address'}
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input required type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Alex" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input required type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Johnson" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input type="tel" name="contactPhone" value={formData.contactPhone || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="(555) 555-5555" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                    <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="alex@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street 1 <span className="text-red-500">*</span></label>
                    <input required type="text" name="street1" value={formData.street1 || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="1240 Innovation Way" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street 2 (Apt, Suite, etc.)</label>
                    <input type="text" name="street2" value={formData.street2 || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Suite 200" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input required type="text" name="city" value={formData.city || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="Boston" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                    <input required type="text" name="state" value={formData.state || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="MA" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code <span className="text-red-500">*</span></label>
                    <input required type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="02110" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" name="country" value={formData.country || ''} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      placeholder="USA" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address Type</label>
                    <select name="addressType" value={formData.addressType} onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="Shipping">Shipping</option>
                      <option value="Billing">Billing</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${formData.isDefault ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                      <input 
                        type="checkbox" 
                        name="isDefault" 
                        checked={formData.isDefault} 
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      {formData.isDefault && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 select-none">Set as Default Address</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">This will remove the default status from other addresses.</p>
                </div>

              </div>

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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