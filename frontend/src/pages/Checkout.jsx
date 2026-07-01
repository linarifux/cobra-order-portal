import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import { fetchAddressesByCustomer, createAddress } from '../store/slices/addressSlice';
import { fetchCarriers } from '../store/slices/carrierSlice'; 
import { 
  ArrowLeft, ArrowRight, ShoppingBag, MapPin, 
  FileText, ShieldCheck, Loader2, Package, Check, Truck, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const EMPTY_ADDRESS_FORM = {
  firstName: '', lastName: '', company: '', street1: '', street2: '', city: '', state: '', zipCode: '', country: 'USA', contactPhone: '', contactEmail: ''
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${randomSuffix}`;
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Extract user and workspace context from Redux globally
  const { user } = useSelector(state => state.auth);
  const activeDivision = useSelector(state => state.divisions?.activeDivision); // Safe pull from division slice
  
  // Redux State
  const cartItems = useSelector(state => state.cart.items);
  const { items: addresses, status: addressStatus } = useSelector(state => state.addresses);
  const { items: carriers, status: carrierStatus } = useSelector(state => state.carriers); 
  
  // Checkout Form State
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  
  // Shipping Method State
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('');

  // Order Details
  const [orderNumber] = useState(generateOrderNumber());
  const [poNumber, setPoNumber] = useState(''); 
  const [orderNotes, setOrderNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Determine the active division ID safely
  const activeDivisionId = activeDivision?._id || localStorage.getItem('dsm_active_division') || user?.divisions?.[0];
  const parsedDivisionId = typeof activeDivisionId === 'object' ? activeDivisionId._id : activeDivisionId;

  // 1. Fetch Addresses scoped dynamically to the logged-in User's Customer ID
  useEffect(() => {
    if (addressStatus === 'idle' && user?.customer) {
      dispatch(fetchAddressesByCustomer(user.customer));
    }
  }, [addressStatus, dispatch, user?.customer]);

  // 2. Fetch Carrier Configurations dynamically scoped by the active Division
  useEffect(() => {
    if (carrierStatus === 'idle' && parsedDivisionId) {
      dispatch(fetchCarriers(parsedDivisionId));
    }
  }, [carrierStatus, dispatch, parsedDivisionId]);

  // 3. Process Carriers matching the nested configuration model array response
  useEffect(() => {
    if (carrierStatus === 'succeeded' && carriers) {
      const flattenedOptions = [];
      
      if (Array.isArray(carriers)) {
        carriers.forEach(carrier => {
          if (carrier.isActive && carrier.enabledServices) {
            carrier.enabledServices.forEach(service => {
              if (service.isActive) {
                flattenedOptions.push({
                  code: service.serviceCode,
                  label: `${carrier.carrierType} - ${service.serviceName}`,
                  carrierId: carrier._id,
                  carrierType: carrier.carrierType
                });
              }
            });
          }
        });
      }

      setShippingOptions(flattenedOptions);
      
      if (flattenedOptions.length > 0) {
        setSelectedShippingMethod(flattenedOptions[0].code);
      }
    }
  }, [carriers, carrierStatus]);

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

  const getProductPrice = (product) => {
    return Number(product.price || product.unitCost || product.cost || 0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (getProductPrice(item.product) * item.quantity), 0);
  const shipping = subtotal > 0 ? 25.00 : 0; 
  const tax = subtotal * 0.08; 
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0 || !user?.customer) return;

    if (!addressForm.firstName || !addressForm.lastName || !addressForm.contactEmail || !addressForm.contactPhone || !addressForm.street1 || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      setFormError('Please fill in all required shipping fields marked with *');
      return;
    }
    if (!selectedShippingMethod) {
      setFormError('Please select a shipping method.');
      return;
    }
    if (!parsedDivisionId) {
      setFormError('Critical Error: No active division context found for this order.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    let finalAddressId = selectedAddressId;

    try {
      if (!finalAddressId && saveToAddressBook) {
        const payload = { 
          ...addressForm, 
          customer: user.customer, 
          addressType: 'Shipping', 
          isDefault: false 
        };
        const savedAddress = await dispatch(createAddress(payload)).unwrap();
        finalAddressId = savedAddress._id;
      }

      const selectedOption = shippingOptions.find(opt => opt.code === selectedShippingMethod);
      const token = localStorage.getItem('token');
      
      const formattedItems = cartItems.map(item => {
        const unitPrice = getProductPrice(item.product);
        return {
          sku: item.product.id,
          name: item.product.desc,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity
        };
      });

      const finalNotes = poNumber ? `PO Number: ${poNumber}\n${orderNotes}` : orderNotes;

      // FIX: Changed "divisions" to "division" to strictly match the backend schema expectation
      const orderPayload = {
        orderNumber,
        customer: user.customer, 
        division: parsedDivisionId, // Passes the active Division ID string directly
        items: formattedItems,
        totalAmount: total,
        shippingAddress: {
          recipientName: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
          email: addressForm.contactEmail,
          phone: addressForm.contactPhone,
          line1: addressForm.street1,
          line2: addressForm.street2,
          city: addressForm.city,
          state: addressForm.state,
          zip: addressForm.zipCode,
          country: addressForm.country || 'USA'
        },
        shippingDetails: {
          carrierId: selectedOption?.carrierId,
          carrierType: selectedOption?.carrierType,
          serviceCode: selectedOption?.code,
          shippingCost: shipping
        },
        notes: finalNotes
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit order to COBRA.');
      }

      dispatch(clearCart());
      setIsSubmitting(false);
      navigate('/orders'); 
      
    } catch (err) {
      console.error('Failed to submit order:', err);
      setFormError(err.message || 'There was a critical error submitting your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!user?.customer) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="font-bold tracking-tight">Authenticating access context...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-md w-full text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/50 border border-white/60 shadow-sm mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Your order queue is empty</h2>
          <p className="text-gray-500 font-medium mt-2 mb-8">
            You need to add products to your cart before you can proceed to the checkout.
          </p>
          <Link to="/products" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const premiumInputClass = "w-full h-12 px-4 rounded-xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-inner";

  return (
    <div className="relative max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* Subtle Background Orbs */}
      <div className="absolute top-10 left-0 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-60 right-0 w-72 h-72 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl -z-10 pointer-events-none"></div>

      <div className="flex items-center gap-5 pb-2">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center justify-center h-12 w-12 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Secure Checkout</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Review your order and submit for fulfillment.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Left Column: Form Details */}
        <div className="flex-1 space-y-6 lg:space-y-8">
          
          {/* Shipping Section */}
          <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative">
            <div className="border-b border-white/50 px-6 py-5 flex items-center gap-3 bg-white/30 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Shipping Information</h2>
            </div>
            
            <div className="p-6 sm:p-8">
              {formError && (
                <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 text-sm font-medium rounded-2xl mb-8 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Address Book Dropdown */}
              <div className="mb-8 p-5 rounded-2xl bg-white/30 border border-white/50">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  Load from Address Book
                </label>
                <div className="relative">
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelect}
                    disabled={addressStatus === 'loading'}
                    className={`${premiumInputClass} cursor-pointer appearance-none disabled:opacity-50`}
                  >
                    <option value="">Select a saved address...</option>
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

              {/* Input Fields */}
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Company Name</label>
                    <input type="text" name="company" value={addressForm.company} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Contact First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstName" value={addressForm.firstName} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Contact Last Name <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" value={addressForm.lastName} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" name="contactPhone" value={addressForm.contactPhone} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="contactEmail" value={addressForm.contactEmail} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Address Line 1 <span className="text-red-500">*</span></label>
                    <input type="text" name="street1" value={addressForm.street1} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Address Line 2</label>
                    <input type="text" name="street2" value={addressForm.street2} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={addressForm.city} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" value={addressForm.state} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">ZIP Code <span className="text-red-500">*</span></label>
                    <input type="text" name="zipCode" value={addressForm.zipCode} onChange={handleInputChange} className={premiumInputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Country <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select name="country" value={addressForm.country} onChange={handleInputChange} className={`${premiumInputClass} appearance-none`}>
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
                  <div className="pt-6 pb-2">
                    <label className="flex items-center gap-3 cursor-pointer group w-max">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-300 ${saveToAddressBook ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white/50 border-white/80 group-hover:border-blue-500 group-hover:bg-white'}`}>
                        <input 
                          type="checkbox" 
                          checked={saveToAddressBook} 
                          onChange={(e) => setSaveToAddressBook(e.target.checked)}
                          className="sr-only"
                        />
                        {saveToAddressBook && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-gray-900 select-none">Save this address to my book</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Shipping Method Section */}
          <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-white/50 px-6 py-5 flex items-center gap-3 bg-white/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-100 to-teal-100 border border-white shadow-inner">
                <Truck className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Shipping Method</h2>
            </div>
            <div className="p-6 sm:p-8">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">
                Preferred Service <span className="text-red-500">*</span>
              </label>
              
              {carrierStatus === 'loading' ? (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 h-12 px-4 border border-white/60 bg-white/50 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching available services...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="text-sm font-medium text-red-600 h-12 px-4 border border-red-200/50 bg-red-50/80 rounded-xl flex items-center shadow-sm">
                  No shipping services are available for this division. Please contact support.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedShippingMethod}
                    onChange={(e) => setSelectedShippingMethod(e.target.value)}
                    className={`${premiumInputClass} cursor-pointer appearance-none`}
                  >
                    <option value="" disabled>Choose a shipping method...</option>
                    {shippingOptions.map(option => (
                      <option key={`${option.carrierId}-${option.code}`} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Order Details Section */}
          <section className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-white/50 px-6 py-5 flex items-center gap-3 bg-white/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-100 to-orange-100 border border-white shadow-inner">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Order Details</h2>
            </div>
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">
                  Order Number <span className="normal-case tracking-normal font-medium text-gray-400">(Auto Generated)</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  readOnly
                  className="w-full h-12 px-4 rounded-xl border border-white/40 bg-white/30 text-gray-500 font-mono text-sm font-bold outline-none cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">
                  PO Number
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-8942"
                  className={premiumInputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 ml-1">Order Notes</label>
                <textarea
                  rows="3"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions for downstream fulfillment..."
                  className="w-full p-4 rounded-xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-inner resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <div className="bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sticky top-28 overflow-hidden">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-gray-900 text-white flex items-center justify-between shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <h2 className="text-lg font-bold tracking-tight relative z-10">Order Summary</h2>
              <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md relative z-10 shadow-sm">
                {cartItems.length} Unique Items
              </span>
            </div>
            
            {/* Items List */}
            <div className="max-h-[350px] overflow-y-auto p-6 space-y-4 custom-scrollbar border-b border-white/50 bg-white/20">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm hover:bg-white/80 transition-colors">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-tr from-gray-100 to-white border border-white flex flex-shrink-0 items-center justify-center shadow-inner">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex flex-col flex-1 justify-center min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate tracking-tight" title={item.product.desc}>
                      {item.product.desc}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 shadow-sm px-2 py-0.5 rounded-md">Qty: {item.quantity}</span>
                      <span className="text-sm font-extrabold text-blue-600">
                        ${((getProductPrice(item.product) || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="p-6 space-y-4 text-sm bg-white/40">
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Shipping Cost</span>
                <span className="font-bold text-gray-900">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 font-medium">
                <span>Estimated Tax</span>
                <span className="font-bold text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 mt-2 border-t border-gray-200/60 flex justify-between items-center">
                <span className="text-base font-extrabold text-gray-900 tracking-tight">Total</span>
                <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="p-6 pt-0 bg-white/40">
              <button 
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || carrierStatus === 'loading' || shippingOptions.length === 0}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <>Submit Order to COBRA <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
              
              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold tracking-tight text-gray-500 uppercase">
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