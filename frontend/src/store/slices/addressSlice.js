import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Fetch ALL addresses globally
export const fetchAddresses = createAsyncThunk(
  'addresses/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch addresses');
      return data.data.addresses; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch addresses specifically for one customer (Ideal for the Order Portal Dropdowns)
export const fetchAddressesByCustomer = createAsyncThunk(
  'addresses/fetchAddressesByCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch customer addresses');
      return data.data.addresses; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAddress = createAsyncThunk(
  'addresses/createAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create address');
      return data.data.address;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'addresses/updateAddress',
  async ({ id, addressData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/addresses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update address');
      return data.data.address;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'addresses/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete address');
      }
      return id; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const addressSlice = createSlice({
  name: 'addresses',
  initialState: {
    items: [],
    status: 'idle', 
    error: null
  },
  reducers: {
    clearAddresses: (state) => {
      state.items = [];
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Handlers
      .addCase(fetchAddresses.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Fetch By Customer Handlers (overwrites items list with that customer's address book)
      .addCase(fetchAddressesByCustomer.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAddressesByCustomer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAddressesByCustomer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Mutations
      .addCase(createAddress.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload);
      });
  }
});

export const { clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;