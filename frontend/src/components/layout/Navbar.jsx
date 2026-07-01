import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart } from '../../store/slices/cartSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { setActiveDivision, fetchDivisions } from '../../store/slices/divisionSlice';
import { AnimatePresence } from 'framer-motion';
import { 
  Box, Home, Package, ClipboardList, MapPin, 
  UserCircle, LogOut, Menu, X, ShoppingCart, Trash2, ArrowRight,
  Building2, Check, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const cartRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Redux State Subscriptions ---
  const cartItems = useSelector(state => state.cart.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const { user } = useSelector(state => state.auth);
  const { items: allDivisions } = useSelector(state => state.divisions);
  
  const activeDivision = useSelector(state => state.divisions.activeDivision);
  const displayDivisionName = activeDivision?.divisionName || 'Corporate Hub';

  // Fetch all division details on mount
  useEffect(() => {
    dispatch(fetchDivisions());
  }, [dispatch]);

  // Map user's assigned division IDs to the full objects from the API to get actual names
  const availableDivisions = useMemo(() => {
    if (!user?.divisions) return [];
    return user.divisions.map(userDiv => {
      const id = userDiv._id || userDiv;
      const fullDetails = allDivisions.find(d => d._id === id);
      return fullDetails || { _id: id, divisionName: `Division ${id.substring(id.length - 4)}` };
    });
  }, [user, allDivisions]);

  const handleSwitchDivision = (div) => {
    const divId = div._id || div;
    if (divId === activeDivision?._id) return; 
    
    dispatch(setActiveDivision(div));
    window.location.href = '/'; 
  };

  // --- Cart Drawer Auto-Open Logic ---
  const prevCartCountRef = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartOpen(true);
      setIsProfileOpen(false); 
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // --- Close Menus on Navigation ---
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // --- Outside Click Handlers ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
      if (cartRef.current && !cartRef.current.contains(event.target)) setIsCartOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout'); 
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsProfileOpen(false);
    navigate('/login');
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
          <div className="relative" ref={cartRef}>
            <button 
              onClick={() => { setIsCartOpen(!isCartOpen); setIsProfileOpen(false); }}
              className={`relative flex items-center justify-center h-12 w-12 rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${isCartOpen ? 'bg-slate-900 border-slate-900 text-brand-gold shadow-md' : 'bg-white/50 border-slate-200 text-slate-600 shadow-sm hover:bg-white/80 hover:shadow-md'}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-red-500 text-[10px] font-black text-white shadow-md ring-2 ring-white/80 animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Slide-out Cart Drawer */}
            <AnimatePresence>
              {isCartOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 origin-top-right rounded-3xl border border-white/80 bg-white/80 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_20px_60px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 slide-in-from-top-4 z-50 flex flex-col max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-5 bg-white/40">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Current Order Queue</h3>
                    <span className="rounded-lg bg-slate-100 text-slate-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-slate-200/80 shadow-sm">
                      {cartItems.length} items
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cartItems.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200/60">
                          <ShoppingCart className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-slate-700">Your order queue is empty.</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Add items from the catalog.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {cartItems.map((item) => (
                          <li key={item.product.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/60 border border-white/80 p-3 shadow-sm hover:bg-white transition-all duration-300 group">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-black text-slate-900 truncate" title={item.product.desc}>{item.product.desc}</span>
                              <span className="text-[10px] font-bold font-mono text-slate-400 truncate mt-0.5">{item.product.id}</span>
                              <div className="flex items-center justify-between mt-3">
                                <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 border border-slate-200/80 uppercase tracking-widest">
                                  Qty: {item.quantity}
                                </span>
                                <span className="text-xs font-black text-brand-gold">
                                  ${(getProductPrice(item.product) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => dispatch(removeFromCart(item.product.id))}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-300 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t border-slate-200/60 p-5 bg-white/60">
                      <button 
                        onClick={handleGoToCheckout}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-4 text-xs font-black uppercase tracking-widest text-brand-gold shadow-lg active:scale-[0.98] transition-all"
                      >
                        Proceed to Checkout <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

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
                        const divName = div.divisionName || `Division Channel`;
                        const isCurrentlySelected = divId === activeDivision?._id;

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
                    <LogOut className="h-4 w-4" /> Terminate Session
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

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-3xl border-b border-slate-200 p-4 shadow-2xl animate-in slide-in-from-top-2">
          <div className="space-y-2 mb-4">
            <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Navigation</p>
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path} 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <link.icon className="h-4 w-4" /> {link.name}
              </NavLink>
            ))}
          </div>
          
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account & Context</p>
            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Building2 className="h-4 w-4 text-brand-gold" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900">{displayDivisionName}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Division</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-2"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}