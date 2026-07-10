import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Utilizing your authorized Axios instance

// Safely pull initial hydration details from persistent storage layers
const getStoredActiveDivision = () => {
  try {
    const id = localStorage.getItem('dsm_active_division');
    const name = localStorage.getItem('dsm_active_division_name');
    
    if (!id) return null;

    // FIX: Only return an object if we actually have a valid name.
    // Otherwise, return just the string ID so the Navbar knows it needs to map the real name.
    if (name && name !== id && name !== 'Workspace') {
      return { _id: id, divisionName: name };
    }
    
    return id;
  } catch {
    return null;
  }
};

// --- Thunk ---
// Fetches the active workspace options allocated to the user's business profile
export const fetchDivisions = createAsyncThunk(
  'divisions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/divisions');
      return response.data?.data?.divisions || response.data?.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch divisions'
      );
    }
  }
);

const divisionSlice = createSlice({
  name: 'divisions',
  initialState: {
    items: [],
    activeDivision: getStoredActiveDivision(), // Hydrated automatically on app startup
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    setActiveDivision: (state, action) => {
      const payload = action.payload;
      if (!payload) return;

      const isObj = typeof payload === 'object' && payload !== null;
      const id = isObj ? payload._id : payload;
      const name = isObj ? payload.divisionName : null;

      // FIX: Strictly prevent saving IDs as Names.
      if (name && name !== id) {
        state.activeDivision = { _id: id, divisionName: name };
        localStorage.setItem('dsm_active_division', id);
        localStorage.setItem('dsm_active_division_name', name);
      } else {
        // Only ID is known (e.g., during auto-login routing). 
        // Store just the string. It will be mapped later.
        state.activeDivision = id;
        localStorage.setItem('dsm_active_division', id);
        localStorage.removeItem('dsm_active_division_name'); // Clear poisoned cache
      }
    },
    clearDivisionContext: (state) => {
      state.items = [];
      state.activeDivision = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('dsm_active_division');
      localStorage.removeItem('dsm_active_division_name');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDivisions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDivisions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;

        // AUTO-HEAL: If the active division is currently just a string ID (because the user 
        // bypassed the matrix), automatically map and inject the real name from the API payload.
        if (typeof state.activeDivision === 'string') {
          const matched = action.payload.find(d => d._id === state.activeDivision);
          if (matched) {
            state.activeDivision = { _id: matched._id, divisionName: matched.divisionName };
            localStorage.setItem('dsm_active_division_name', matched.divisionName);
          }
        }
      })
      .addCase(fetchDivisions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setActiveDivision, clearDivisionContext } = divisionSlice.actions;
export default divisionSlice.reducer;