import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';
import inventoryReducer from './slices/inventorySlice';
import addressReducer from './slices/addressSlice';
import carrierReducer from './slices/carrierSlice';
import divisionReducer from './slices/divisionSlice'; 
import checkoutReducer from './slices/checkoutSlice';
import cartReducer from './slices/cartSlice'; 
import customerReducer from './slices/customerSlice';
import freightProviderReducer from './slices/freightProviderSlice'; 

// NEW: Import the injection function from your API file
import { injectStore } from '../utils/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    inventory: inventoryReducer,
    addresses: addressReducer,
    carriers: carrierReducer,
    divisions: divisionReducer,
    freightProviders: freightProviderReducer,
    checkout: checkoutReducer,
    cart: cartReducer, 
    customers: customerReducer
  },
});

// NEW: Pass the fully initialized store to your Axios instance
// This completely avoids the Circular Dependency crash
injectStore(store);