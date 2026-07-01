import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to securely get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Fetch all orders - dynamically scoped to the logged-in user's customer context
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (customerId, { rejectWithValue }) => {
    try {
      // Append the customer ID as a query parameter to filter operations on the backend
      const url = customerId ? `${API_URL}/orders?customer=${customerId}` : `${API_URL}/orders`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
      
      // Extract the order array from the response data wrapper
      return data.data?.orders || data.data || []; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch a single order by its direct database ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, { headers: getAuthHeaders() });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch order details');
      
      return data.data?.order || data.data; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    currentOrder: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    detailsStatus: 'idle',
    error: null
  },
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.detailsStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Operations
      .addCase(fetchOrders.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Single Operation Profile
      .addCase(fetchOrderById.pending, (state) => { 
        state.detailsStatus = 'loading'; 
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailsStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;