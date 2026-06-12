import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import { fetchAddressesByCustomer, createAddress } from '../store/slices/addressSlice';
import { 
  ArrowLeft, ArrowRight, ShoppingBag, MapPin, 
  FileText, ShieldCheck, Loader2, Package, Check, Truck
} from 'lucide-react';

const CUSTOMER_ID = '6a266dc144c2698dcc55390c';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const EMPTY_ADDRESS_FORM = {
  firstName: '', lastName: '', company: '', street1: '', street2: '', city: '', state: '', zipCode: '', country: 'USA', contactPhone: '', contactEmail: ''
};

// Utility to generate a random order number
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${randomSuffix}`;
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const cartItems = useSelector(state => state.cart.items);
  const { items: addresses, status: addressStatus } = useSelector(state => state.addresses);
  
  // Checkout Form State
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  
  // Shipping Method State
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('');
  const [isLoadingShipping, setIsLoadingShipping] = useState(true);

  // Auto-generated Order Number
  const [orderNumber] = useState(generateOrderNumber());
  const [poNumber, setPoNumber] = useState(''); // If you want to append PO number to notes
  const [orderNotes, setOrderNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Fetch Addresses
  useEffect(() => {
    if (addressStatus === 'idle') {
      dispatch(fetchAddressesByCustomer(CUSTOMER_ID));
    }
  }, [addressStatus, dispatch]);

  // 2. Fetch Customer Carrier/Shipping Configurations
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/customers/${CUSTOMER_ID}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await response.json();

        if (data.status === 'success' && data.data?.customer?.carrierConfigurations) {
          const configs = data.data.customer.carrierConfigurations;
          const flattenedOptions = [];

          configs.forEach(config => {
            if (config.isActive && config.carrier?.isActive) {
              const carrierName = config.carrier.carrierType; // e.g. "FedEx"
              const carrierId = config.carrier._id;
              
              config.allowedServices.forEach(service => {
                if (service.isActive) {
                  flattenedOptions.push({
                    code: service.serviceCode,
                    label: `${carrierName} - ${service.serviceName}`,
                    carrierId: carrierId,
                    carrierType: carrierName
                  });
                }
              });
            }
          });

          setShippingOptions(flattenedOptions);
          if (flattenedOptions.length > 0) {
            setSelectedShippingMethod(flattenedOptions[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to load shipping configurations:', err);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingMethods();
  }, []);

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
    return Number(product.cost || product.unitCost || 0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (getProductPrice(item.product) * item.quantity), 0);
  const shipping = subtotal > 0 ? 25.00 : 0; 
  const tax = subtotal * 0.08; 
  const total = subtotal + shipping + tax;

  // --- API INTEGRATION FIX: Submit Actual Order Payload ---
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!addressForm.firstName || !addressForm.lastName || !addressForm.contactEmail || !addressForm.contactPhone || !addressForm.street1 || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
      setFormError('Please fill in all required shipping fields marked with *');
      return;
    }
    if (!selectedShippingMethod) {
      setFormError('Please select a shipping method.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    let finalAddressId = selectedAddressId;

    try {
      // 1. Conditionally create address if user checked the box
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

      // 2. Prepare exact schema payload for Orders API
      const selectedOption = shippingOptions.find(opt => opt.code === selectedShippingMethod);
      const token = localStorage.getItem('token');
      
      // Formatting items array for the order item schema
      const formattedItems = cartItems.map(item => {
        const unitPrice = getProductPrice(item.product);
        return {
          sku: item.product.id, // ID maps to SKU in product schema
          name: item.product.desc,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity
        };
      });

      // Combine notes with PO if required by your business logic
      const finalNotes = poNumber ? `PO Number: ${poNumber}\n${orderNotes}` : orderNotes;

      const orderPayload = {
        orderNumber,
        customer: CUSTOMER_ID,
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

      // 3. Post to API
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

      // 4. Success workflow
      dispatch(clearCart());
      setIsSubmitting(false);
      navigate('/orders'); // Send user to orders page to see their new submission
      
    } catch (err) {
      console.error('Failed to submit order:', err);
      setFormError(err.message || 'There was a critical error submitting your order. Please try again.');
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

          {/* Shipping Method Section */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3 bg-gray-50/50">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Method</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred Service <span className="text-red-500">*</span>
              </label>
              
              {isLoadingShipping ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 h-11 px-4 border border-gray-100 bg-gray-50 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching available services...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="text-sm text-red-500 h-11 px-4 border border-red-100 bg-red-50 rounded-xl flex items-center">
                  No shipping services are available for this customer.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedShippingMethod}
                    onChange={(e) => setSelectedShippingMethod(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="" disabled>Choose a shipping method...</option>
                    {shippingOptions.map(option => (
                      <option key={option.code} value={option.code}>
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
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3 bg-gray-50/50">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Order Number <span className="text-gray-400 font-normal ml-1">(System Generated)</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  readOnly
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-mono text-sm outline-none cursor-default"
                />
              </div>
              {/* Optional PO Number Input if needed visually */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PO Number (Optional)</label>
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
                disabled={isSubmitting || isLoadingShipping || shippingOptions.length === 0}
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