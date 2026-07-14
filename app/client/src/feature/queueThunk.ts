import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type {
  ApiResponse,
  QueueJoinResponse,
  QueueMode,
} from "../types/queueInterface";
import { QUEUE_MODE_TO_TYPE } from "../types/queueInterface";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

// POST /queue_entry/match
export const startQueue = createAsyncThunk<
  QueueJoinResponse,
  QueueMode,
  { rejectValue: string }
>("queue/startQueue", async (mode, { rejectWithValue }) => {
  try {
    const queueType = QUEUE_MODE_TO_TYPE[mode];

    const res = await axiosInstance.post<ApiResponse<QueueJoinResponse>>(
      "/queue_entry/match",
      { queueType },
    );

    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to join matchmaking queue");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

// GET /queue_entry/status?queueType=...
export const checkQueueStatus = createAsyncThunk<
  QueueJoinResponse,
  QueueMode,
  { rejectValue: string }
>("queue/checkStatus", async (mode, { rejectWithValue }) => {
  try {
    const queueType = QUEUE_MODE_TO_TYPE[mode];
    const res = await axiosInstance.get<ApiResponse<QueueJoinResponse>>(
      "/queue_entry/status",
      { params: { queueType } },
    );
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to check queue status");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

// DELETE /queue_entry/match?queueType=...
export const cancelQueue = createAsyncThunk<
  void,
  QueueMode,
  { rejectValue: string }
>("queue/cancel", async (mode, { rejectWithValue }) => {
  try {
    const queueType = QUEUE_MODE_TO_TYPE[mode];
    await axiosInstance.delete("/queue_entry/match", { params: { queueType } });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to cancel queue");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});
