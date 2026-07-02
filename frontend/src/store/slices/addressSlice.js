import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Fetch ALL addresses globally (Admin/System Manager level)
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

// Fetch addresses specifically for one User (Aligned with Address Schema 'user' ref)
export const fetchAddressesByUser = createAsyncThunk(
  'addresses/fetchAddressesByUser',
  async (userId, { rejectWithValue }) => {
    try {
      // Endpoint updated to query by User ID instead of Customer ID
      const response = await fetch(`${API_URL}/users/${userId}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch user addresses');
      return data.data.addresses; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create Address (Ensure the payload passed from UI includes { user: userId })
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
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Handlers
      .addCase(fetchAddresses.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Fetch By User Handlers
      .addCase(fetchAddressesByUser.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAddressesByUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchAddressesByUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Mutations
      .addCase(createAddress.fulfilled, (state, action) => {
        // If the new address is set as default, remove the default flag from others
        if (action.payload.isDefault) {
          state.items = state.items.map(item => 
            item.addressType === action.payload.addressType 
              ? { ...item, isDefault: false } 
              : item
          );
        }
        state.items.unshift(action.payload);
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        // If updated to default, remove the default flag from others
        if (action.payload.isDefault) {
          state.items = state.items.map(item => 
            item.addressType === action.payload.addressType && item._id !== action.payload._id
              ? { ...item, isDefault: false } 
              : item
          );
        }
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