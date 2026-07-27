import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Package, Trash2, Minus, Plus, Weight } from 'lucide-react';
import { removeFromCart, addToCart } from '../../store/slices/cartSlice';

const CartItemImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-50 to-slate-100">
        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-white flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt || 'Product image'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default function CartItem({ item }) {
  
  const dispatch = useDispatch();
  const targetId = item?.product?.id || item?.product?._id;
  const getProductPrice = (product) => Number(product?.price || product?.unitCost || product?.cost || 0);

  const handleUpdateQuantity = (delta) => {
    if (!targetId) return;
    if (item.quantity + delta > 0) {
      console.log(item)
      dispatch(addToCart({ product: item.product, quantity: delta }));
    } else {
      dispatch(removeFromCart(targetId));
    }
  };

  return (
    <motion.li 
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95, x: 20 }}
      transition={{ duration: 0.2 }}
      className="relative flex gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl bg-white/60 border border-white/80 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-colors pointer-events-none" />
      
      <div className="h-16 w-16 sm:h-[88px] sm:w-[88px] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/60 bg-white/50 flex items-center justify-center shrink-0 shadow-inner relative z-10">
        <CartItemImage src={item?.product?.image || item?.product?.productImage} alt={item?.product?.desc} />
      </div>

      <div className="flex flex-col min-w-0 flex-1 justify-between relative z-10 py-0.5">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate pr-6 sm:pr-4" title={item.product?.desc}>
            {item.product?.desc}
          </h4>
          <p className="text-[9px] sm:text-[10px] font-bold font-mono text-slate-400 truncate mt-0.5 flex items-center gap-1">
            SKU: {targetId} <span className="text-slate-300">•</span> <Weight size={10} /> {(Number(item.product?.weight) || 0)} oz/ea
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs sm:text-sm font-black text-blue-600 truncate mr-2">
            ${(getProductPrice(item?.product) * (item?.quantity || 0)).toFixed(2)}
          </span>
          
          <div className="flex items-center bg-white border border-slate-200/80 rounded-lg sm:rounded-xl shadow-sm h-7 sm:h-8 shrink-0">
            <button 
              onClick={() => handleUpdateQuantity(-1)}
              className="w-7 sm:w-8 h-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-l-lg sm:rounded-l-xl transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 sm:w-8 text-center text-[10px] sm:text-xs font-black text-slate-700 select-none">
              {item.quantity}
            </span>
            <button 
              onClick={() => handleUpdateQuantity(1)}
              className="w-7 sm:w-8 h-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-r-lg sm:rounded-r-xl transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={() => dispatch(removeFromCart(targetId))}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 sm:p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-20"
        title="Remove item"
      >
        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </motion.li>
  );
}