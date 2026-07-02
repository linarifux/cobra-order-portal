import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, syncCartDivision, addToCart, clearCart } from '../../store/slices/cartSlice'; 
import { logoutUser } from '../../store/slices/authSlice';
import { setActiveDivision, fetchDivisions } from '../../store/slices/divisionSlice';
import { AnimatePresence, motion } from 'framer-motion'; 
import { 
  Box, Home, Package, ClipboardList, MapPin, 
  UserCircle, LogOut, Menu, X, ShoppingCart, Trash2, ArrowRight,
  Building2, Check, ChevronDown, Plus, Minus, Sparkles, AlertCircle,
  Truck
} from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Redux State Subscriptions ---
  const cartItems = useSelector(state => state.cart.items) || [];
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + ((item.product.price || item.product.unitCost || 0) * item.quantity), 0);
  
  const { user } = useSelector(state => state.auth);
  const { items: allDivisions } = useSelector(state => state.divisions);
  
  const activeDivision = useSelector(state => state.divisions.activeDivision);
  const activeDivId = activeDivision?._id || activeDivision;
  const displayDivisionName = activeDivision?.divisionName || 'Corporate Hub';

  // --- Gamification Settings ---
  const FREE_SHIPPING_THRESHOLD = 500;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100) || 0;
  const amountToFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  // --- Synchronization Effects ---
  useEffect(() => {
    dispatch(fetchDivisions());
  }, [dispatch]);

  useEffect(() => {
    if (activeDivId) {
      dispatch(syncCartDivision(activeDivId));
    }
  }, [activeDivId, dispatch]);

  const prevCartCountRef = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartOpen(true);
      setIsProfileOpen(false); 
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableDivisions = useMemo(() => {
    if (!user?.divisions) return [];
    return user.divisions.map(userDiv => {
      const id = userDiv._id || userDiv;
      const fullDetails = (allDivisions || []).find(d => d._id === id);
      return fullDetails || { _id: id, divisionName: `Division ${String(id).slice(-4)}` };
    });
  }, [user, allDivisions]);

  const handleSwitchDivision = (div) => {
    const divId = div._id || div;
    if (divId === activeDivId) return; 
    
    dispatch(setActiveDivision(div));
    window.location.href = '/'; 
  };

  const handleGoToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout'); 
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsProfileOpen(false);
    navigate('/login');
  };

  // --- Cart Quick Actions ---
  const handleUpdateQuantity = (item, delta) => {
    if (item.quantity + delta > 0) {
      dispatch(addToCart({ product: item.product, quantity: delta }));
    } else {
      dispatch(removeFromCart(item.product.id));
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to empty your order queue?")) {
      dispatch(clearCart());
    }
  };

  const getProductPrice = (product) => Number(product.price || product.unitCost || 0);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ClipboardList },
    { name: 'Addresses', path: '/address', icon: MapPin },
  ];

  const desktopNavClass = ({ isActive }) => 
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
      isActive 
        ? 'bg-slate-900 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  if (location.pathname === '/login') return null; 

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-white/60 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* LEFT: Branding & Navigation */}
          <div className="flex items-center gap-8 xl:gap-12">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-gold to-amber-400 text-slate-900 shadow-lg shadow-brand-gold/30 group-hover:shadow-brand-gold/50 transition-all duration-300 group-hover:scale-105">
                <Box className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Cobra Fulfillment</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <Building2 size={10} className="text-brand-gold" /> {displayDivisionName}
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 border-l border-slate-200/60 pl-8">
              {navLinks.map((link) => (
                <NavLink key={link.name} to={link.path} className={desktopNavClass}>
                  <link.icon className="h-4 w-4" /> 
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* RIGHT: Actions & Profile */}
          <div className="flex items-center gap-3 sm:gap-5 relative">
            
            {/* Cart Drawer Toggle */}
            <button 
              onClick={() => { setIsCartOpen(!isCartOpen); setIsProfileOpen(false); }}
              className={`relative flex items-center justify-center h-12 w-12 rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold bg-white/50 border-slate-200 text-slate-600 shadow-sm hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5`}
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-red-500 text-[10px] font-black text-white shadow-md ring-2 ring-white/80"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <div className="hidden sm:block h-10 w-px bg-slate-200/80 rounded-full mx-2"></div>

            {/* Premium Profile Dropdown */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsCartOpen(false); }}
                className={`flex items-center gap-3 rounded-2xl py-1.5 pl-1.5 pr-4 border transition-all duration-300 ${isProfileOpen ? 'bg-white/80 border-slate-300 shadow-md' : 'bg-white/40 border-slate-200 text-slate-700 shadow-sm hover:bg-white/80 hover:shadow-md'}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-white shadow-inner">
                  <UserCircle className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="max-w-[120px] truncate text-xs font-black tracking-tight leading-none mb-0.5">
                    {user?.name || user?.firstName || 'Portal User'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    Context <ChevronDown size={10} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-72 origin-top-right rounded-[2rem] border border-white/80 bg-white/80 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_20px_60px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 slide-in-from-top-4 z-50 overflow-hidden flex flex-col">
                  
                  <div className="px-6 py-5 border-b border-slate-200/60 bg-white/40">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Authorized User'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 truncate mt-1 uppercase tracking-widest">{user?.email || 'user@example.com'}</p>
                  </div>

                  {availableDivisions.length > 0 && (
                    <div className="p-3 border-b border-slate-100/80 bg-slate-50/50">
                      <p className="px-3 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Division Context</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        {availableDivisions.map((div) => {
                          const divId = div._id || div;
                          const divName = div.divisionName || `Division ${String(divId).slice(-4)}`;
                          const isCurrentlySelected = divId === activeDivId;

                          return (
                            <button
                              key={divId}
                              onClick={() => handleSwitchDivision(div)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                isCurrentlySelected 
                                  ? 'bg-slate-900 text-white shadow-md cursor-default' 
                                  : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
                              }`}
                            >
                              <span className="text-xs font-bold truncate pr-3">{divName}</span>
                              {isCurrentlySelected && <Check size={14} className="text-brand-gold shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-white/40">
                    <button 
                      onClick={handleLogout} 
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50 border border-white/60 text-slate-600 shadow-sm hover:bg-white/80 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* FIXED: Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-3xl border-b border-slate-200 p-4 shadow-2xl animate-in slide-in-from-top-2 z-[90]">
            <div className="space-y-2 mb-4">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Navigation</p>
              {navLinks.map((link) => (
                <NavLink 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <link.icon className="h-4 w-4" /> {link.name}
                </NavLink>
              ))}
            </div>
            
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Context</p>
              <div className="max-h-48 overflow-y-auto space-y-1 mb-2 custom-scrollbar">
                {availableDivisions.map((div) => {
                  const divId = div._id || div;
                  const divName = div.divisionName || `Division ${String(divId).slice(-4)}`;
                  const isCurrentlySelected = divId === activeDivId;

                  return (
                    <button
                      key={divId}
                      onClick={() => {
                        handleSwitchDivision(div);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all ${
                        isCurrentlySelected 
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' 
                          : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Building2 className={`h-4 w-4 shrink-0 ${isCurrentlySelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-sm truncate pr-3">{divName}</span>
                      </div>
                      {isCurrentlySelected && <Check size={16} className="text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={handleLogout} 
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-2 border border-transparent hover:border-red-100"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* SUPERIOR FULL-HEIGHT CART DRAWER - RENDERED OUTSIDE THE NAV CONTEXT */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Glassmorphic Drawer Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative h-full w-full sm:w-[480px] bg-white/85 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.2)] flex flex-col border-l border-white/60"
            >
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-6 border-b border-white/50 bg-white/40">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Order Queue</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                      </span>
                      {cartItems.length > 0 && (
                        <button onClick={handleClearCart} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors">
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2.5 rounded-2xl bg-white/50 border border-slate-200/60 text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 hover:rotate-90 transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

             
              
              {/* Dynamic Content Body */}
              <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative">
                {cartItems.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-80 p-8">
                    <motion.div 
                      initial={{ y: 20 }} animate={{ y: 0 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                      className="h-28 w-28 bg-gradient-to-tr from-slate-50 to-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-white"
                    >
                      <Package className="h-12 w-12 text-slate-300" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Queue is empty</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-[240px]">Navigate to the product catalog to start drafting your fulfillment order.</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); navigate('/products'); }} 
                      className="mt-8 flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      <ShoppingCart className="h-4 w-4" /> Start Browsing
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                      {cartItems.map((item) => (
                        <motion.li 
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                          animate={{ opacity: 1, scale: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95, x: 20 }}
                          transition={{ duration: 0.2 }}
                          key={item.product.id} 
                          className="relative flex gap-4 rounded-3xl bg-white/60 border border-white/80 p-4 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
                        >
                          {/* Subtle Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-colors pointer-events-none" />
                          
                          <div className="h-[88px] w-[88px] rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-inner relative z-10">
                            <Package className="h-8 w-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                          </div>

                          <div className="flex flex-col min-w-0 flex-1 justify-between relative z-10 py-0.5">
                            <div>
                              <h4 className="text-sm font-black text-slate-900 truncate pr-4" title={item.product.desc}>{item.product.desc}</h4>
                              <p className="text-[10px] font-bold font-mono text-slate-400 truncate mt-0.5">SKU: {item.product.id}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-black text-blue-600">
                                ${(getProductPrice(item.product) * item.quantity).toFixed(2)}
                              </span>
                              
                              {/* Action Pill Controls */}
                              <div className="flex items-center bg-white border border-slate-200/80 rounded-xl shadow-sm h-8">
                                <button 
                                  onClick={() => handleUpdateQuantity(item, -1)}
                                  className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-l-xl transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-black text-slate-700 select-none">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => handleUpdateQuantity(item, 1)}
                                  className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-r-xl transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Absolute Positioned Quick Trash */}
                          <button 
                            onClick={() => dispatch(removeFromCart(item.product.id))}
                            className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {/* Elevated Footer Summary */}
              {cartItems.length > 0 && (
                <div className="p-6 bg-white/70 border-t border-white/60 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>Subtotal</span>
                      <span className="text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>Est. Taxes & Shipping</span>
                      <span className="text-slate-400 text-xs uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Calculated Next
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200/60 flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Due</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">${subtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleGoToCheckout}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all"
                  >
                    Secure Checkout <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}