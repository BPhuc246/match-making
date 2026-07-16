import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type { ApiResponse } from "../types/queueInterface";
import type { GameChoice, MatchStateResponse } from "../types/matchInterface";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export const fetchMatch = createAsyncThunk<
  MatchStateResponse,
  string,
  { rejectValue: string }
>("match/fetch", async (matchId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<MatchStateResponse>>(
      `/match/${matchId}`,
    );
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to load match");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

export const submitChoice = createAsyncThunk<
  MatchStateResponse,
  { matchId: string; choice: GameChoice },
  { rejectValue: string }
>("match/submitChoice", async ({ matchId, choice }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<ApiResponse<MatchStateResponse>>(
      `/match/${matchId}/choice`,
      { choice },
    );
    return res.data.result;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to submit choice");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});

export const leaveMatch = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("match/leave", async (matchId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/match/${matchId}/leave`);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data || "Failed to leave match");
      return rejectWithValue(error.response?.data || "Error");
    }

    toast.error("Unknown error");
    return rejectWithValue("Unknown error");
  }
});
