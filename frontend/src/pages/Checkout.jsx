import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import { fetchAddressesByCustomer, createAddress } from '../store/slices/addressSlice';
import { 
  ArrowLeft, ArrowRight, ShoppingBag, MapPin, 
  FileText, ShieldCheck, Loader2, Package, Check
} from 'lucide-react';

const CUSTOMER_ID = '6a266dc144c2698dcc55390c';

const EMPTY_ADDRESS_FORM = {
  firstName: '', lastName: '', company: '', street1: '', street2: '', city: '', state: '', zipCode: '', country: 'USA', contactPhone: '', contactEmail: ''
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const cartItems = useSelector(state => state.cart.items);
  const { items: addresses, status: addressStatus } = useSelector(state => state.addresses);
  
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  
  const [poNumber, setPoNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (addressStatus === 'idle') {
      dispatch(fetchAddressesByCustomer(CUSTOMER_ID));
    }
  }, [addressStatus, dispatch]);

  const handleAddressSelect = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    
    if (id) {
      const addr = addresses.find(a => a._id === id);
      if (addr) {
        let dbCountry = addr.country || 'USA';
        if (dbCountry === 'United States') dbCountry = 'USA';

        setAddressForm({
          firstName: addr.firstName || '',
          lastName: addr.lastName || '',
          company: addr.company || '',
          street1: addr.street1 || '',
          street2: addr.street2 || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zipCode || '',
          country: dbCountry,
          contactPhone: addr.contactPhone || '',
          contactEmail: addr.contactEmail || '',
        });
        setSaveToAddressBook(false);
      }
    } else {
      setAddressForm(EMPTY_ADDRESS_FORM);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (selectedAddressId) {
      setSelectedAddressId('');
    }
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  // --- FIX: Safely extract the price whether it came from the List or Details page ---
  const getProductPrice = (product) => {
    return Number(product.cost || product.unitCost || 0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (getProductPrice(item.product) * item.quantity), 0);
  const shipping = subtotal > 0 ? 25.00 : 0; 
  const tax = subtotal * 0.08; 
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!addressForm.firstName || !addressForm.lastName || !addressForm.street1 || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      setFormError('Please fill in all required shipping fields marked with *');
      return;
    }
    if (!poNumber.trim()) {
      setFormError('Purchase Order (PO) Number is required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    let finalAddressId = selectedAddressId;

    try {
      if (!finalAddressId && saveToAddressBook) {
        const payload = { 
          ...addressForm, 
          customer: CUSTOMER_ID, 
          addressType: 'Shipping', 
          isDefault: false 
        };
        const savedAddress = await dispatch(createAddress(payload)).unwrap();
        finalAddressId = savedAddress._id;
      }

      setTimeout(() => {
        console.log('Order Pushed to COBRA:', {
          items: cartItems,
          addressId: finalAddressId || 'custom_one_time_address',
          shippingDetails: addressForm,
          poNumber,
          notes: orderNotes,
          total
        });

        dispatch(clearCart());
        setIsSubmitting(false);
        navigate('/orders'); 
      }, 1500);

    } catch (err) {
      console.error('Failed to save address:', err);
      setFormError('Failed to save address to your book. Please check your data.');
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
          <ShoppingBag className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your order queue is empty</h2>
        <p className="text-gray-500 mt-2 max-w-md text-center mb-8">
          You need to add products to your cart before you can proceed to the COBRA checkout.
        </p>
        <Link to="/products" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Secure Checkout</h1>
          <p className="text-sm text-gray-500">Review your order and submit to COBRA.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form Details */}
        <div className="flex-1 space-y-8">
          
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
              </div>
            </div>
            
            <div className="p-6">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl mb-6 flex items-start gap-3">
                  <span className="font-bold">Error:</span> {formError}
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  My Address Book
                </label>
                <div className="relative max-w-md">
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelect}
                    disabled={addressStatus === 'loading'}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select an address...</option>
                    {addresses.map((addr) => (
                      <option key={addr._id} value={addr._id}>
                        {addr.firstName} {addr.lastName} {addr.company ? `(${addr.company})` : ''} - {addr.street1}, {addr.city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    {addressStatus === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                    <input type="text" name="company" value={addressForm.company} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact First Name*</label>
                    <input type="text" name="firstName" value={addressForm.firstName} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Last Name*</label>
                    <input type="text" name="lastName" value={addressForm.lastName} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number*</label>
                    <input type="tel" name="contactPhone" value={addressForm.contactPhone} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email*</label>
                    <input type="email" name="contactEmail" value={addressForm.contactEmail} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1*</label>
                    <input type="text" name="street1" value={addressForm.street1} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2</label>
                    <input type="text" name="street2" value={addressForm.street2} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City*</label>
                    <input type="text" name="city" value={addressForm.city} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State*</label>
                    <input type="text" name="state" value={addressForm.state} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code*</label>
                    <input type="text" name="zipCode" value={addressForm.zipCode} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country*</label>
                    <div className="relative">
                      <select name="country" value={addressForm.country} onChange={handleInputChange} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white">
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                        {addressForm.country !== 'USA' && addressForm.country !== 'Canada' && addressForm.country !== '' && (
                          <option value={addressForm.country}>{addressForm.country}</option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {!selectedAddressId && (
                  <div className="pt-4 pb-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${saveToAddressBook ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        <input 
                          type="checkbox" 
                          checked={saveToAddressBook} 
                          onChange={(e) => setSaveToAddressBook(e.target.checked)}
                          className="sr-only"
                        />
                        {saveToAddressBook && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className="text-base font-medium text-gray-900 select-none">Add this address to your address book?</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3 bg-gray-50/50">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Purchase Order Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-8942"
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions for downstream fulfillment..."
                  className="w-full p-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-24 overflow-hidden">
            <div className="p-6 bg-gray-900 text-white">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <p className="text-gray-400 text-sm mt-1">{cartItems.length} unique items</p>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-6 space-y-4 custom-scrollbar border-b border-gray-100">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-50 border border-gray-200 flex flex-shrink-0 items-center justify-center">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <div className="flex flex-col flex-1 justify-center min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={item.product.desc}>
                      {item.product.desc}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${(getProductPrice(item.product) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax</span>
                <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 pt-0 bg-gray-50/50">
              <button 
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <>Submit Order to COBRA <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Secure connection to COBRA fulfillment
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}