import { createSlice } from "@reduxjs/toolkit";
import { fetch, login, logout, register } from "../feature/authThunk";
import type { AuthInitialState } from "../types/userInterface";

const authInitialState: AuthInitialState = {
  user: null,
  status: "idle",
  error: null,
};

export const AuthSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocalUser: (state, action) => {
      if (state.user) {
        state.user = action.payload;
      }
    },
  },
  extraReducers(builder) {
    // Fetch user
    builder
      .addCase(fetch.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetch.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetch.rejected, (state) => {
        state.status = "rejected";
        state.user = null;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.status = "pending";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "pending";
        state.user = action.payload;
      })
      .addCase(register.rejected, (state) => {
        state.status = "rejected";
        state.user = null;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.status = "pending";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "pending";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state) => {
        state.status = "rejected";
        state.user = null;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.status = "pending";
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = "pending";
        state.user = null;
      })
      .addCase(logout.rejected, (state) => {
        state.status = "rejected";
      });
  },
});

export const { clearError, updateLocalUser } = AuthSlice.actions;
export default AuthSlice.reducer;
