import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely read from centralized localStorage key
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('dsm_cart_items'); // <-- Fixed key synchronization mismatch
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.warn("Failed to load cart from storage", error);
    return [];
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(), 
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
      
      // Multi-layered fallback save
      try {
        localStorage.setItem('dsm_cart_items', JSON.stringify(state.items));
      } catch (err) {
        console.error(err);
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.product.id !== action.payload);
      
      try {
        localStorage.setItem('dsm_cart_items', JSON.stringify(state.items));
      } catch (err) {
        console.error(err);
      }
    },
    clearCart: (state) => {
      state.items = [];
      try {
        localStorage.removeItem('dsm_cart_items');
      } catch (err) {
        console.error(err);
      }
    }
  }
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;