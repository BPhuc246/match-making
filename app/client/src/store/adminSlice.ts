import { createSlice } from "@reduxjs/toolkit";
import type { AdminSliceState } from "../types/adminInterface";
import { fetchCalibration } from "../feature/adminThunk";

const initialState: AdminSliceState = {
  calibration: null,
  status: "idle",
  error: null,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalibration.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCalibration.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.calibration = action.payload;
      })
      .addCase(fetchCalibration.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load calibration data";
      });
  },
});

export default adminSlice.reducer;