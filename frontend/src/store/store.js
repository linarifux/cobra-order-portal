import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import inventoryReducer from './slices/inventorySlice';
import addressReducer from './slices/addressSlice';
import carrierReducer from './slices/carrierSlice';
import divisionReducer from './slices/divisionSlice'; 

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
    addresses: addressReducer,
    carriers: carrierReducer,
    divisions: divisionReducer, 
  },
});

store.subscribe(() => {
  try {
    const currentCartItems = store.getState().cart.items;
    localStorage.setItem('dsm_cart_items', JSON.stringify(currentCartItems));
  } catch (error) {
    console.warn("Failed to save cart to storage", error);
  }
});