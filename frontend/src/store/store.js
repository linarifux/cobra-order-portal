import { configureStore } from '@reduxjs/toolkit';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import inventoryReducer from './slices/inventorySlice';
import addressReducer from './slices/addressSlice';

export const store = configureStore({
  reducer: {
    orders: orderReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
    addresses: addressReducer,
  },
});