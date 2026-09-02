import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion'; 
import { Box, Home, Package, ClipboardList, MapPin, Menu, X, ShoppingCart, Building2 } from 'lucide-react';

import { setActiveDivision, fetchDivisions } from '../../store/slices/divisionSlice';
import { fetchCartDb } from '../../store/slices/cartSlice'; 
import { fetchCustomerById } from '../../store/slices/customerSlice'; 

import CartDrawer from '../navbar/CartDrawer';
import MobileMenu from '../navbar/MobileMenu';
import ProfileMenu from '../navbar/ProfileMenu';

import BracoLogo from '/bracco/logo.png';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const location = useLocation();
  const dispatch = useDispatch();

  const cartItems = useSelector(state => state.cart?.items) || [];
  const cartCount = cartItems.reduce((total, item) => total + (item?.quantity || 0), 0);
  
  // Extract statuses to monitor loading phases
  const { user, status: authStatus } = useSelector(state => state.auth || {});
  const { items: allDivisions = [], status: divisionStatus } = useSelector(state => state.divisions || {});
  const { currentCustomer, status: customerStatus } = useSelector(state => state.customers || {}); 
  
  const activeDivisionRaw = useSelector(state => state.divisions?.activeDivision);
  const activeDivId = typeof activeDivisionRaw === 'object' ? activeDivisionRaw?._id : activeDivisionRaw;
  
  // Safely Auto-select division inside a useEffect
  useEffect(() => {
    if (user?.divisions?.length === 1 && !activeDivId) {
      dispatch(setActiveDivision(user.divisions[0]));
    }
  }, [user?.divisions, activeDivId, dispatch]);

  const activeDivObj = typeof activeDivisionRaw === 'object' && activeDivisionRaw !== null
    ? activeDivisionRaw 
    : allDivisions.find(d => d._id === activeDivisionRaw);

  // --- Fetch Customer Data ---
  const customerId = user?.customer?._id || user?.customer;
  
  useEffect(() => {
    if (customerId && String(currentCustomer?._id) !== String(customerId)) {
      dispatch(fetchCustomerById(customerId));
    }
  }, [dispatch, customerId, currentCustomer?._id]);

  // --- Synchronization Effects ---
  useEffect(() => {
    dispatch(fetchDivisions());
  }, [dispatch]);

  // Fetch the specific division's cart when the app loads OR when the user switches divisions.
  useEffect(() => {
    if (user && activeDivId) {
      dispatch(fetchCartDb());
    }
  }, [user, activeDivId, dispatch]);

  // Auto-open cart when items are manually added
  const prevCartCountRef = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartOpen(true);
      setIsProfileOpen(false); 
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Reset toggles on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

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

  // --- STRICT DATA READINESS CHECK ---
  // We evaluate if auth, divisions, or customers are loading.
  // We also strictly ensure the customer ID in Redux matches the User's exact Customer ID.
  const isDataPending = 
    authStatus === 'loading' || 
    divisionStatus === 'loading' || 
    customerStatus === 'loading' || 
    (customerId && String(currentCustomer?._id) !== String(customerId));

  // Render an empty, structural navbar to prevent layout shifting while loading.
  if (isDataPending) {
    return (
      <nav className="sticky top-0 z-[100] w-full border-b border-white/60 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 h-16 sm:h-20" />
    );
  }

  // --- Data Variables (Safely evaluated ONLY after loading is finished) ---
  const displayCustomerName = currentCustomer?.customerName;
  const isBracco = Boolean(displayCustomerName?.toLowerCase().includes('bracco'));
  
  // Determine division name display (excluding "Corporate")
  const rawDivisionName = activeDivObj?.divisionName || null;
  const displayDivisionName = rawDivisionName && rawDivisionName.toLowerCase() !== 'corporate' 
    ? rawDivisionName 
    : null;

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-white/60 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* LEFT: Branding & Navigation */}
          <div className="flex items-center gap-6 sm:gap-8 xl:gap-12 min-w-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
              
              {/* Conditional Logo Rendering */}
              {isBracco ? (
                <img 
                  src={BracoLogo} 
                  alt="Bracco Logo" 
                  className="h-9 sm:h-11 w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-sm" 
                />
              ) : (
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-gold to-amber-400 text-slate-900 shadow-lg shadow-brand-gold/30 group-hover:shadow-brand-gold/50 transition-all duration-300 group-hover:scale-105">
                  <Box className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                </div>
              )}
              
              {/* Customer and Division Labels */}
              {displayCustomerName && !isBracco && (
                <div className="hidden sm:flex flex-col min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate max-w-[200px] lg:max-w-[250px]" title={displayCustomerName}>
                    {displayCustomerName}
                  </h1>
                  {displayDivisionName && (
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1 truncate max-w-[200px] lg:max-w-[250px]" title={displayDivisionName}>
                      <Building2 size={10} className="text-brand-gold shrink-0" /> <span className="truncate">{displayDivisionName}</span>
                    </p>
                  )}
                </div>
              )}
            </Link>

            <div className="hidden md:flex items-center gap-1 lg:gap-2 border-l border-slate-200/60 pl-6 lg:pl-8">
              {navLinks.map((link) => (
                <NavLink key={link.name} to={link.path} className={desktopNavClass}>
                  <link.icon className="h-4 w-4" /> 
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* RIGHT: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 relative shrink-0">
            
            {/* Cart Drawer Toggle */}
            <button 
              onClick={() => { setIsCartOpen(!isCartOpen); setIsProfileOpen(false); }}
              className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold bg-white/50 border-slate-200 text-slate-600 shadow-sm hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-lg bg-red-500 text-[9px] sm:text-[10px] font-black text-white shadow-md ring-2 ring-white/80"
                  >
                    
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <div className="hidden sm:block h-8 sm:h-10 w-px bg-slate-200/80 rounded-full mx-1 sm:mx-2"></div>

            <ProfileMenu 
              isOpen={isProfileOpen} 
              onToggle={() => { setIsProfileOpen(!isProfileOpen); setIsCartOpen(false); }} 
              onClose={() => setIsProfileOpen(false)}
            />

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-white/50 border border-white/60 text-slate-600 shadow-sm hover:bg-white/80 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          navLinks={navLinks} 
        />
      </nav>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}