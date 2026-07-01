import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Utilizing your authorized Axios instance

// Safely pull initial hydration details from persistent storage layers
const getStoredActiveDivision = () => {
  try {
    const id = localStorage.getItem('dsm_active_division');
    const name = localStorage.getItem('dsm_active_division_name') || 'Workspace';
    return id ? { _id: id, divisionName: name } : null;
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
      const division = action.payload; // Expects an object: { _id: "...", divisionName: "..." }
      if (!division) return;

      const id = division._id || division;
      const name = division.divisionName || 'Active Workspace';

      state.activeDivision = { _id: id, divisionName: name };
      
      // Keep persistent parameters matching the state
      localStorage.setItem('dsm_active_division', id);
      localStorage.setItem('dsm_active_division_name', name);
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
      })
      .addCase(fetchDivisions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setActiveDivision, clearDivisionContext } = divisionSlice.actions;
export default divisionSlice.reducer;