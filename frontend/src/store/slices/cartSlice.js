import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely load division-scoped carts
const loadCartsFromStorage = () => {
  try {
    const savedCarts = localStorage.getItem('dsm_carts_by_division');
    return savedCarts ? JSON.parse(savedCarts) : {};
  } catch (error) {
    console.warn("Failed to load carts from storage", error);
    return {};
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartsByDivision: loadCartsFromStorage(), // Stores ALL division carts: { divId: [items], divId2: [items] }
    items: [], // The active "viewport" array representing the current division's cart
    activeDivisionId: null,
  },
  reducers: {
    // Fired by the Navbar whenever the user switches contexts
    syncCartDivision: (state, action) => {
      const divisionId = action.payload;
      state.activeDivisionId = divisionId;
      
      // Initialize a blank cart for this division if one doesn't exist yet
      if (!state.cartsByDivision[divisionId]) {
        state.cartsByDivision[divisionId] = [];
      }
      
      // Mount this division's specific array to the active items viewport
      state.items = state.cartsByDivision[divisionId];
    },
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;
      const divId = state.activeDivisionId;
      
      if (!divId) return; // Prevent adding items to a null boundary

      const currentCart = state.cartsByDivision[divId];
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        currentCart.push({ product, quantity });
      }
      
      // Keep the viewport synced
      state.items = currentCart;
      
      try {
        localStorage.setItem('dsm_carts_by_division', JSON.stringify(state.cartsByDivision));
      } catch (err) {
        console.error(err);
      }
    },
    removeFromCart: (state, action) => {
      const divId = state.activeDivisionId;
      if (!divId) return;

      // Filter item out of the specific division cart
      state.cartsByDivision[divId] = state.cartsByDivision[divId].filter(item => item.product.id !== action.payload);
      state.items = state.cartsByDivision[divId];
      
      try {
        localStorage.setItem('dsm_carts_by_division', JSON.stringify(state.cartsByDivision));
      } catch (err) {
        console.error(err);
      }
    },
    clearCart: (state) => {
      const divId = state.activeDivisionId;
      if (!divId) return;

      state.cartsByDivision[divId] = [];
      state.items = [];
      
      try {
        localStorage.setItem('dsm_carts_by_division', JSON.stringify(state.cartsByDivision));
      } catch (err) {
        console.error(err);
      }
    }
  }
});

export const { syncCartDivision, addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;