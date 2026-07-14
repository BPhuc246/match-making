import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type {
  ApiResponse,
  QueueJoinResponse,
  QueueMode,
} from "../types/queueInterface";
import { QUEUE_MODE_TO_TYPE } from "../types/queueInterface";

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
  } catch (err: any) {
    const message =
      err?.response?.data?.message || "Failed to join matchmaking queue";

    return rejectWithValue(message);
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
  } catch (err: any) {
    const message =
      err?.response?.data?.message || "Failed to check queue status";
    return rejectWithValue(message);
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
  } catch (err: any) {
    // 404 = nothing was waiting (e.g. already matched right before cancel) — not a real failure
    if (err?.response?.status === 404) {
      return;
    }
    const message = err?.response?.data?.message || "Failed to cancel queue";
    return rejectWithValue(message);
  }
});
