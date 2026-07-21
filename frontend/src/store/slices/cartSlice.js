import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; 
import { toast } from 'sonner';

// 1. Fetch cart from DB on login/load/division switch
export const fetchCartDb = createAsyncThunk('cart/fetchCartDb', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const divisionId = state.divisions?.activeDivision?._id || state.divisions?.activeDivision;
    
    // Abort if no division is selected yet
    if (!divisionId) return [];

    const response = await api.get(`/cart?division=${divisionId}`);
    const rawItems = response.data.data.cart.items || [];
    
    return rawItems.map(item => {
      const p = item.product || {};
      return {
        ...item,
        product: {
          ...p,
          id: p._id || p.id || item.sku,
          desc: p.itemName || p.description || item.name || 'Product',
          image: p.productImage || p.image || null,
          price: item.unitPrice || p.price || p.unitCost || 0,
          weight: p.weight || 0
        }
      };
    });
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

// 2. Background sync to DB
export const syncCartDb = createAsyncThunk('cart/syncCartDb', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    const state = getState();
    const cartItems = state.cart.items;
    
    if (!state.auth?.user) return null;
    if (!state.cart.isInitialized) return null;

    const customerId = state.auth.user.customer?._id || state.auth.user.customer || state.divisions?.activeDivision?.customer;
    const divisionId = state.divisions?.activeDivision?._id || state.divisions?.activeDivision;

    if (!customerId || !divisionId) return null;

    const payload = {
      customer: customerId,
      division: divisionId,
      items: cartItems.map(item => ({
        product: item.product?._id || item.product?.id,
        sku: item.product?.sku || 'N/A',
        name: item.product?.itemName || item.product?.desc || 'Product',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.product?.price || item.product?.unitCost || 0)
      }))
    };

    const response = await api.put('/cart', payload);
    return response.data.data.cart.items;
  } catch (error) {
    toast.error("Failed to save cart. Restoring previous state.");
    dispatch(fetchCartDb()); 
    return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
  }
});

// 3. Clear cart completely from DB
export const clearCartDb = createAsyncThunk('cart/clearCartDb', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const divisionId = state.divisions?.activeDivision?._id || state.divisions?.activeDivision;
    
    if (!divisionId) return [];

    await api.delete(`/cart?division=${divisionId}`);
    return [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    status: 'idle',
    isInitialized: false,
    error: null,
  },
  reducers: {
    addItemLocal: (state, action) => {
      state.isInitialized = true; 
      const payload = action.payload;
      const product = payload.product ? payload.product : payload;
      const quantity = payload.quantity !== undefined ? payload.quantity : 1;

      const existingItem = state.items.find(
        item => String(item.product._id || item.product.id) === String(product._id || product.id)
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
        if (existingItem.quantity <= 0) {
            state.items = state.items.filter(
                item => String(item.product._id || item.product.id) !== String(product._id || product.id)
            );
        }
      } else if (quantity > 0) {
        state.items.push({ product, quantity });
      }
    },
    removeItemLocal: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        item => String(item.product._id || item.product.id) !== String(productId)
      );
    },
    updateQuantityLocal: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => String(item.product._id || item.product.id) === String(id));
      if (item && quantity > 0) {
        item.quantity = quantity;
      } else if (item && quantity <= 0) {
        state.items = state.items.filter(i => String(i.product._id || i.product.id) !== String(id));
      }
    },
    clearCartLocal: (state) => {
      state.items = [];
      state.isInitialized = false; 
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartDb.pending, (state) => { 
        state.status = 'loading'; 
        state.items = []; 
        state.isInitialized = false;
      })
      .addCase(fetchCartDb.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; 
        state.isInitialized = true; 
      })
      .addCase(fetchCartDb.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(clearCartDb.fulfilled, (state) => { 
        state.items = []; 
      });
  }
});

export const { addItemLocal, removeItemLocal, updateQuantityLocal, clearCartLocal } = cartSlice.actions;

let syncTimeout = null;
const triggerDebouncedSync = () => (dispatch) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    dispatch(syncCartDb());
  }, 800); 
};

export const addToCart = (payload) => (dispatch) => {
  dispatch(addItemLocal(payload));
  dispatch(triggerDebouncedSync());
};

export const removeFromCart = (productId) => (dispatch) => {
  dispatch(removeItemLocal(productId));
  dispatch(triggerDebouncedSync());
};

export const updateQuantity = (id, quantity) => (dispatch) => {
  dispatch(updateQuantityLocal({ id, quantity }));
  dispatch(triggerDebouncedSync());
};

export const clearCart = () => (dispatch) => {
  dispatch(clearCartLocal());
  dispatch(clearCartDb());
}

export default cartSlice.reducer;