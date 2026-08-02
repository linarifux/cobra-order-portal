import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, AlertCircle, ArrowRight, Weight, Loader2 } from 'lucide-react';
import { clearCart } from '../../store/slices/cartSlice';
import CartItem from './CartItem';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const cartItems = useSelector(state => state.cart?.items) || [];
  const cartStatus = useSelector(state => state.cart?.status); // Pull sync status
  const cartCount = cartItems.reduce((total, item) => total + (item?.quantity || 0), 0);

  const getProductPrice = (product) => Number(product?.price || product?.unitCost || product?.cost || 0);
  const subtotal = cartItems.reduce((total, item) => total + (getProductPrice(item?.product) * (item?.quantity || 0)), 0);

  const totalWeightInOunces = cartItems.reduce((acc, item) => {
    const itemOunces = Number(item.product?.weight) || 0;
    return acc + (itemOunces * item.quantity);
  }, 0);
  
  // Calculate separated lbs and oz
  const totalWeightLbs = Math.floor(totalWeightInOunces / 16);
  const totalWeightOz = +(totalWeightInOunces % 16).toFixed(2); // Using + drops unnecessary trailing zeros

  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout'); 
  };

  const handleClearCart = () => {
    if (isConfirmingClear) {
      dispatch(clearCart());
      setIsConfirmingClear(false);
      onClose();
    } else {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative h-full w-full sm:w-[480px] bg-white/85 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.2)] flex flex-col border-l border-white/60"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 border-b border-white/50 bg-white/40">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 pr-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate">Order Queue</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 whitespace-nowrap">
                      {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                    </span>
                    
                    {cartItems.length > 0 && cartStatus !== 'loading' && (
                      <button 
                        onClick={handleClearCart} 
                        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap px-2 py-0.5 rounded-md border ${
                          isConfirmingClear 
                            ? 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse' 
                            : 'text-red-500 hover:text-red-600 border-transparent hover:bg-red-50'
                        }`}
                      >
                        {isConfirmingClear ? 'Confirm Clear?' : 'Clear All'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 shrink-0 rounded-xl sm:rounded-2xl bg-white/50 border border-slate-200/60 text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 hover:rotate-90 transition-all duration-300"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Dynamic Content Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-4 sm:py-6 custom-scrollbar relative">
              {cartStatus === 'loading' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Syncing Cart...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-80 p-6 sm:p-8">
                  <motion.div 
                    initial={{ y: 20 }} animate={{ y: 0 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                    className="h-24 w-24 sm:h-28 sm:w-28 bg-gradient-to-tr from-slate-50 to-slate-100 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-5 sm:mb-6 shadow-inner border border-white"
                  >
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">Queue is empty</h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-[200px] sm:max-w-[240px]">Navigate to the product catalog to start drafting your fulfillment order.</p>
                  <button 
                    onClick={() => { onClose(); navigate('/products'); }} 
                    className="mt-6 sm:mt-8 flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <ShoppingCart className="h-4 w-4" /> Start Browsing
                  </button>
                </div>
              ) : (
                <ul className="space-y-3 sm:space-y-4">
                  <AnimatePresence mode='popLayout'>
                    {cartItems.map((item) => (
                      <CartItem key={item?.product?.id || item?.product?._id} item={item} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Elevated Footer Summary */}
            {cartItems.length > 0 && cartStatus !== 'loading' && (
              <div className="p-4 sm:p-6 bg-white/70 border-t border-white/60 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span className="text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Weight size={14} /> Est. Total Weight</span>
                    <span className="text-slate-900">{totalWeightLbs} lb {totalWeightOz} oz</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-500">
                    <span>Est. Taxes & Shipping</span>
                    <span className="text-slate-400 text-[9px] sm:text-xs uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Calculated Next
                    </span>
                  </div>
                  <div className="pt-2 sm:pt-3 border-t border-slate-200/60 flex justify-between items-end">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Total Due</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoToCheckout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 sm:h-14 text-xs sm:text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all"
                >
                  Secure Checkout <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}