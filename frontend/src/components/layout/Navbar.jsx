import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart } from '../../store/slices/cartSlice';
import { 
  Box, Home, Package, ClipboardList, MapPin, 
  Search, UserCircle, LogOut, Menu, X, Settings, ShoppingCart, Trash2, ArrowRight
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

  // Redux Cart State
  const cartItems = useSelector(state => state.cart.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

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

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ClipboardList },
    { name: 'Addresses', path: '/address', icon: MapPin },
  ];

  const desktopNavClass = ({ isActive }) => 
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-blue-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Box className="h-5 w-5" />
            </div>
            <span className="tracking-tight">DSM Portal</span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={desktopNavClass}>
                <link.icon className="h-4 w-4" /> 
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 relative">
          
          {/* Cart Toggle */}
          <div className="relative" ref={cartRef}>
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative flex rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Slide-out Cart Drawer */}
            {isCartOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 z-50 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-base font-semibold text-gray-900">Current Order</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {cartItems.length} items
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      <ShoppingCart className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      Your order queue is empty.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {cartItems.map((item) => (
                        <li key={item.product.id} className="flex items-start justify-between gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{item.product.id}</span>
                            <span className="text-xs text-gray-500 truncate">{item.product.desc}</span>
                            <span className="text-xs font-semibold text-blue-600 mt-0.5">
                              Qty: {item.quantity} 
                              <span className="text-gray-400 font-normal ml-1">
                                (${(item.product.unitCost || 0).toFixed(2)}/ea)
                              </span>
                            </span>
                          </div>
                          <button 
                            onClick={() => dispatch(removeFromCart(item.product.id))}
                            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-2xl">
                    <button 
                      onClick={handleGoToCheckout}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      Proceed to Checkout <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

          {/* Profile Dropdown */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full p-1 pr-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <UserCircle className="h-7 w-7 text-gray-400" />
              <span>Admin</span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@shopbric.com</p>
                </div>
                <div className="py-1">
                  <button onClick={() => console.log('Logout')} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </nav>
  );
}