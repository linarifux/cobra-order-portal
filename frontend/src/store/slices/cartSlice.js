import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely read from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('cp_cart_items');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.warn("Failed to load cart from storage", error);
    return [];
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    // Inject the saved data here instead of starting with an empty []
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
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.product.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    }
  }
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;