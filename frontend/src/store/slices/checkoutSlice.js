import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; 

// --- Thunks ---

// 1. Fetch Live Shipping Rates securely for the customer
export const calculateShippingRates = createAsyncThunk(
  'checkout/calculateRates',
  async (ratePayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/shipstation/rates/live', ratePayload);
      
      // The backend returns an array of filtered/sorted rates
      return response.data.data.rates || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to calculate shipping rates.'
      );
    }
  }
);

// 2. Submit the Final Order to COBRA
export const placeOrder = createAsyncThunk(
  'checkout/placeOrder',
  async (orderPayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderPayload);
      
      return response.data.data.order || response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'There was a critical error submitting your order.'
      );
    }
  }
);

// --- Slice Definition ---

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    // Rate State
    rates: [],
    ratesStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    ratesError: null,
    
    // Order State
    currentOrder: null,
    orderStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    orderError: null
  },
  reducers: {
    // Utility to reset checkout state when unmounting or after successful checkout
    clearCheckoutState: (state) => {
      state.rates = [];
      state.ratesStatus = 'idle';
      state.ratesError = null;
      
      state.currentOrder = null;
      state.orderStatus = 'idle';
      state.orderError = null;
    },
    // Allows the frontend to clear just the rates if the user changes their zip code
    clearRates: (state) => {
      state.rates = [];
      state.ratesStatus = 'idle';
      state.ratesError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Calculate Rates ---
      .addCase(calculateShippingRates.pending, (state) => {
        state.ratesStatus = 'loading';
        state.ratesError = null;
        state.rates = []; // Clear old rates while loading new ones
      })
      .addCase(calculateShippingRates.fulfilled, (state, action) => {
        state.ratesStatus = 'succeeded';
        
        // Map the backend response into the format our dropdown expects
        state.rates = action.payload.map(r => ({
          code: r.code,
          label: `${r.carrierCode.toUpperCase()} - ${r.name} ($${r.cost.toFixed(2)})`,
          cost: r.cost,
          carrierId: r.carrierId,
          carrierType: r.carrierCode
        }));
      })
      .addCase(calculateShippingRates.rejected, (state, action) => {
        state.ratesStatus = 'failed';
        state.ratesError = action.payload;
      })
      
      // --- Place Order ---
      .addCase(placeOrder.pending, (state) => {
        state.orderStatus = 'loading';
        state.orderError = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orderStatus = 'succeeded';
        state.currentOrder = action.payload;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.orderStatus = 'failed';
        state.orderError = action.payload;
      });
  }
});

export const { clearCheckoutState, clearRates } = checkoutSlice.actions;
export default checkoutSlice.reducer;