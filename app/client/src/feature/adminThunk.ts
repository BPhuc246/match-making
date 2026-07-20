import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type { ApiResponse } from "../types/queueInterface";
import type { CalibrationSummary } from "../types/adminInterface";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export const fetchCalibration = createAsyncThunk<
  CalibrationSummary,
  void,
  { rejectValue: string }
>("admin/fetchCalibration", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<CalibrationSummary>>(
      "/admin/matchmaking/calibration",
    );
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to load calibration data");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});
