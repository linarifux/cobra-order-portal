import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Action to load initial order data
    setOrders: (state, action) => {
      state.items = action.payload;
    },
    // Action to clear orders on logout
    clearOrders: (state) => {
      state.items = [];
    }
  },
});

export const { setOrders, clearOrders } = orderSlice.actions;
export default orderSlice.reducer;