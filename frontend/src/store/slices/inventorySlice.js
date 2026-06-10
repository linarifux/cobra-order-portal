import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Async thunk to fetch inventory from the backend
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/inventory`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch inventory');
      }

      return data.data.inventory;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default inventorySlice.reducer;