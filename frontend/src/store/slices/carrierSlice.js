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

// Async Thunk to fetch carriers for a specific customer
export const fetchCustomerCarriers = createAsyncThunk(
  'carriers/fetchCustomerCarriers',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/carriers`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shipping methods');
      }

      // We extract the cleanly flattened array provided by the updated backend route
      return data.data?.carriers || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const carrierSlice = createSlice({
  name: 'carriers',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    clearCarriers: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerCarriers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomerCarriers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; // Saves the flattened array to state
      })
      .addCase(fetchCustomerCarriers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearCarriers } = carrierSlice.actions;
export default carrierSlice.reducer;