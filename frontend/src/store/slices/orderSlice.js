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

// Fetch orders - dynamically scoped to User, Customer, or Division
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ customerId, divisionId, userId } = {}, { rejectWithValue }) => {
    try {
      // Dynamically build query parameters based on what is provided
      const queryParams = new URLSearchParams();
      if (customerId) queryParams.append('customer', customerId);
      if (divisionId) queryParams.append('division', divisionId);
      if (userId) queryParams.append('user', userId); // Intercepted by backend to filter by shopper

      const queryString = queryParams.toString();
      const url = queryString ? `${API_URL}/orders?${queryString}` : `${API_URL}/orders`;
      
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

// NEW: Update an Order (used for releasing pending orders, status changes, etc)
export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to update order');
      
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
      })
      // Update Order (Release pending orders)
      .addCase(updateOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        // Update the order in the list if it exists
        const index = state.items.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          state.items[index] = updatedOrder;
        }
        // Update the current active order if it matches
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      });
  }
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;