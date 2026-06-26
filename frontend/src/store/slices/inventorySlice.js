import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Ensure this points to your Axios instance with interceptors

// 1. Fetch ALL Inventory Assets
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory');
      return response.data.data.inventory || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch inventory');
    }
  }
);

// 2. Fetch SINGLE Inventory Asset by ID
export const fetchInventoryById = createAsyncThunk(
  'inventory/fetchInventoryById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data.data.inventory || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch asset details');
    }
  }
);

// 3. Create New Inventory Asset
export const createInventory = createAsyncThunk(
  'inventory/createInventory',
  async (inventoryData, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory', inventoryData);
      return response.data.data.inventory || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create asset');
    }
  }
);

// 4. Update Existing Inventory Asset
export const updateInventory = createAsyncThunk(
  'inventory/updateInventory',
  async ({ id, inventoryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/inventory/${id}`, inventoryData);
      return response.data.data.inventory || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update asset');
    }
  }
);

// 5. Delete Inventory Asset
export const deleteInventory = createAsyncThunk(
  'inventory/deleteInventory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/inventory/${id}`);
      return id; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete asset');
    }
  }
);


const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    currentItem: null, // Used for the Detail View page
    status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    createStatus: 'idle',
    error: null
  },
  reducers: {
    // Clear out the single item state when leaving the Detail View
    clearCurrentInventoryItem: (state) => {
      state.currentItem = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchInventory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Fetch Single by ID ---
      .addCase(fetchInventoryById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInventoryById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentItem = action.payload;
      })
      .addCase(fetchInventoryById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Create ---
      .addCase(createInventory.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createInventory.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.unshift(action.payload); // Add new item to the top of the list
      })
      .addCase(createInventory.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
      })

      // --- Update ---
      .addCase(updateInventory.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        // Update in the items array
        state.items = state.items.map(item => 
          item._id === action.payload._id ? action.payload : item
        );
        // If the updated item is currently being viewed, update that too
        if (state.currentItem && state.currentItem._id === action.payload._id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
      })

      // --- Delete ---
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload);
        if (state.currentItem && state.currentItem._id === action.payload) {
          state.currentItem = null;
        }
      });
  }
});

export const { clearCurrentInventoryItem } = inventorySlice.actions;
export default inventorySlice.reducer;