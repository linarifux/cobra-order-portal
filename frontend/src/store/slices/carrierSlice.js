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

// Async Thunk refactored to fetch carriers for a specific division
export const fetchCarriersByDivision = createAsyncThunk(
  'carriers/fetchCarriersByDivision',
  async (divisionId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/divisions/${divisionId}/carriers`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shipping methods for this division');
      }

      // Extract the flattened carrier services array from the response data layer
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
      .addCase(fetchCarriersByDivision.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCarriersByDivision.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; 
      })
      .addCase(fetchCarriersByDivision.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearCarriers } = carrierSlice.actions;
export default carrierSlice.reducer;