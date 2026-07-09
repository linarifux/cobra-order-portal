import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper to safely load user from storage on initial load
const loadUserFromStorage = () => {
  try {
    const savedUser = localStorage.getItem('cp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Assuming your API returns { status: 'success', data: { user: {...}, token: '...' } }
      const { user } = data.data;
      const {token} = data

      // Persist to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('cp_user', JSON.stringify(user));

      return { user, token };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadUserFromStorage(),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('cp_user');
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});

export const { logoutUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;