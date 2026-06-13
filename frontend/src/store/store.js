import { configureStore } from '@reduxjs/toolkit';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import inventoryReducer from './slices/inventorySlice';
import addressReducer from './slices/addressSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    orders: orderReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
    addresses: addressReducer,
    auth: authReducer,
  },
});

// Watch the Redux store for ANY changes
store.subscribe(() => {
  try {
    // Extract just the cart items from the global state
    const currentCartItems = store.getState().cart.items;
    
    // Save the exact array back to the browser
    localStorage.setItem('dsm_cart_items', JSON.stringify(currentCartItems));
  } catch (error) {
    console.warn("Failed to save cart to storage", error);
  }
});