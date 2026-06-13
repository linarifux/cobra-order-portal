import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart } from '../../store/slices/cartSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { 
  Box, Home, Package, ClipboardList, MapPin, 
  UserCircle, LogOut, Menu, X, ShoppingCart, Trash2, ArrowRight
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

  // Redux State
  const cartItems = useSelector(state => state.cart.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
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

  const getProductPrice = (product) => {
    return Number(product.cost || product.unitCost || 0);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ClipboardList },
    { name: 'Addresses', path: '/address', icon: MapPin },
  ];

  // Premium Navigation Link Styles
  const desktopNavClass = ({ isActive }) => 
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
      isActive 
        ? 'bg-white/60 text-blue-700 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-white/80' 
        : 'text-gray-600 hover:bg-white/40 hover:text-gray-900 border border-transparent'
    }`;

  if (location.pathname === '/login') {
    return null; 
  }

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/40 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.04)] supports-[backdrop-filter]:bg-white/30">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 font-bold text-xl text-gray-900 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
              <Box className="h-5 w-5" />
            </div>
            <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              DSM Portal
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={desktopNavClass}>
                <link.icon className="h-4 w-4" /> 
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 relative">
          
          {/* Premium Cart Toggle */}
          <div className="relative" ref={cartRef}>
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative flex items-center justify-center h-11 w-11 rounded-full bg-white/50 border border-white/60 text-gray-700 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white/80">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Premium Slide-out Cart Drawer */}
            {isCartOpen && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 origin-top-right rounded-3xl border border-white/60 bg-white/70 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 z-50 flex flex-col max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200/50 px-6 py-4 bg-white/40">
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">Current Order</h3>
                  <span className="rounded-full bg-blue-100/80 text-blue-700 px-3 py-1 text-xs font-bold border border-blue-200/50 shadow-sm">
                    {cartItems.length} items
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="h-16 w-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white/60">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">Your order queue is empty.</p>
                      <p className="text-xs text-gray-500 mt-1">Add items to get started.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {cartItems.map((item) => (
                        <li key={item.product.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/50 border border-white/60 p-3 shadow-sm hover:bg-white/80 transition-all duration-300 group">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-gray-900 truncate">{item.product.id}</span>
                            <span className="text-xs text-gray-500 truncate mt-0.5">{item.product.desc}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center justify-center rounded-md bg-gray-100/80 px-2 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200/50">
                                Qty: {item.quantity}
                              </span>
                              <span className="text-xs font-semibold text-blue-600">
                                ${(getProductPrice(item.product) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => dispatch(removeFromCart(item.product.id))}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-gray-200/50 p-5 bg-white/60 backdrop-blur-md">
                    <button 
                      onClick={handleGoToCheckout}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
                    >
                      Proceed to Checkout <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block h-8 w-px bg-gray-300/50 rounded-full"></div>

          {/* Premium Profile Dropdown */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 bg-white/50 border border-white/60 text-sm font-medium text-gray-700 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-300"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-white shadow-inner">
                <UserCircle className="h-5 w-5 text-gray-500" />
              </div>
              <span className="max-w-[120px] truncate font-semibold tracking-tight">{user?.name || user?.firstName || 'User'}</span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-60 origin-top-right rounded-3xl border border-white/60 bg-white/70 backdrop-blur-3xl backdrop-saturate-150 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 z-50">
                <div className="px-5 py-4 border-b border-gray-200/50 bg-white/40 rounded-t-3xl mb-1.5">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Portal User'}
                  </p>
                  <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="px-1.5 pb-1.5">
                  <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-full bg-white/50 border border-white/60 text-gray-700 shadow-sm hover:bg-white/80 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}