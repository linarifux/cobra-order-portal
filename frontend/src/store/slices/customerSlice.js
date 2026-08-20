import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Ensure this points to your authorized Axios instance

// --- Thunks ---

// 1. Fetch All Customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/customers');
      
      // Defensive fallback against API wrapping changes
      return response.data.data.customers || response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch customers');
    }
  }
);

// 2. Fetch Single Customer by ID
export const fetchCustomerById = createAsyncThunk(
  'customers/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data.data.customer || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch customer details');
    }
  }
);

// 3. Create a New Customer
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data.data.customer || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create customer');
    }
  }
);

// 4. Update an Existing Customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/customers/${id}`, updatedData);
      return response.data.data.customer || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update customer');
    }
  }
);

// 5. Delete/Remove a Customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id; // Return ID to filter out of the Redux state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete customer');
    }
  }
);

// --- Slice Definition ---
const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    items: [],
    currentCustomer: null, // Holds the single customer fetched by ID
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    // Utility to wipe state (e.g., on user logout or unmounting)
    clearCustomers: (state) => {
      state.items = [];
      state.currentCustomer = null;
      state.status = 'idle';
      state.error = null;
    },
    // Clear just the currently viewed customer
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Fetch Single by ID ---
      .addCase(fetchCustomerById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // --- Create ---
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      
      // --- Update ---
      .addCase(updateCustomer.fulfilled, (state, action) => {
        // Safe string casting prevents Mongoose ObjectId strict equality mismatches
        const index = state.items.findIndex(c => String(c._id) === String(action.payload._id));
        if (index !== -1) {
          state.items[index] = action.payload;
        }

        // Keep currentCustomer synced if it is the one being updated
        if (state.currentCustomer && String(state.currentCustomer._id) === String(action.payload._id)) {
          state.currentCustomer = action.payload;
        }
      })
      
      // --- Delete ---
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(c => String(c._id) !== String(action.payload));
        
        // Clear current customer view if the active profile was deleted
        if (state.currentCustomer && String(state.currentCustomer._id) === String(action.payload)) {
          state.currentCustomer = null;
        }
      });
  }
});

export const { clearCustomers, clearCurrentCustomer } = customerSlice.actions;
export default customerSlice.reducer;