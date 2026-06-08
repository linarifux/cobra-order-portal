import { configureStore } from '@reduxjs/toolkit';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    orders: orderReducer,
    cart: cartReducer, 
  },
});