import { configureStore } from '@reduxjs/toolkit';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import inventoryReducer from './slices/inventorySlice';

export const store = configureStore({
  reducer: {
    orders: orderReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
  },
});