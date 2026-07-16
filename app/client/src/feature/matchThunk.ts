import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios";
import type { ApiResponse } from "../types/queueInterface";
import type { GameChoice, MatchStateResponse } from "../types/matchInterface";

export const fetchMatch = createAsyncThunk<
  MatchStateResponse,
  string,
  { rejectValue: string }
>("match/fetch", async (matchId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<MatchStateResponse>>(`/match/${matchId}`);
    return res.data.result;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to load match");
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
      { choice }
    );
    return res.data.result;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to submit choice");
  }
});

export const leaveMatch = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("match/leave", async (matchId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/match/${matchId}/leave`);
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to leave match");
  }
});