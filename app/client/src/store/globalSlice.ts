import { createSlice, createAction } from "@reduxjs/toolkit";
import type { UserInfo } from "../types/userInterface";
import {
  cancelQueue,
  checkQueueStatus,
  startQueue,
} from "../feature/queueThunk";
import type { QueueJoinResponse } from "../types/queueInterface";

export interface GlobalInitialState {
  isQueuing: boolean;
  queueMode: "casual" | "rank" | null;
  queueStartTime: number | null;
  queueElapsedTime: number; // in seconds
  matchedMatchId: number | null;
  leaderboard: UserInfo[];
  leaderboardStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const setMatched = createAction<QueueJoinResponse>("global/setMatched");

const initialState: GlobalInitialState = {
  isQueuing: false,
  queueMode: null,
  queueStartTime: null,
  queueElapsedTime: 0,
  matchedMatchId: null,
  leaderboard: [],
  leaderboardStatus: "idle",
  error: null,
};

// Custom sync actions
export const updateQueueTimer = createAction<number>("global/updateQueueTimer");
export const setLeaderboard = createAction<UserInfo[]>("global/setLeaderboard");
export const clearMatchedMatchId = createAction("global/clearMatchedMatchId");

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    incrementQueueTime: (state) => {
      state.queueElapsedTime += 1;
    },
    resetQueueState: (state) => {
      state.isQueuing = false;
      state.queueMode = null;
      state.queueStartTime = null;
      state.queueElapsedTime = 0;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(startQueue.pending, (state) => {
        state.error = null;
      })
      .addCase(startQueue.fulfilled, (state, action) => {
        if (action.payload.status === "MATCHED") {
          state.isQueuing = false;
          state.queueMode = null;
          state.matchedMatchId = action.payload.matchId;
        } else {
          state.isQueuing = true;
          state.queueMode = action.meta.arg;
          state.queueStartTime = Date.now();
          state.queueElapsedTime = 0;
          state.matchedMatchId = null;
        }
      })
      .addCase(setMatched, (state, action) => {
        state.isQueuing = false;
        state.queueMode = null;
        state.queueStartTime = null;
        state.matchedMatchId = action.payload.matchId;
      })
      .addCase(startQueue.rejected, (state, action) => {
        state.isQueuing = false;
        state.queueMode = null;
        state.error =
          (action.payload as string) || "Failed to start matchmaking";
      })
      .addCase(cancelQueue.fulfilled, (state) => {
        state.isQueuing = false;
        state.queueMode = null;
        state.queueStartTime = null;
        state.queueElapsedTime = 0;
      })

      .addCase(checkQueueStatus.fulfilled, (state, action) => {
        if (action.payload.status === "MATCHED") {
          state.isQueuing = false;
          state.queueMode = null;
          state.queueStartTime = null;
          state.matchedMatchId = action.payload.matchId;
        }
      })
      .addCase(updateQueueTimer, (state, action) => {
        state.queueElapsedTime = action.payload;
      })
      .addCase(setLeaderboard, (state, action) => {
        state.leaderboard = action.payload;
        state.leaderboardStatus = "succeeded";
      })
      .addCase(clearMatchedMatchId, (state) => {
        state.matchedMatchId = null;
      });
  },
});

export const { incrementQueueTime, resetQueueState } = globalSlice.actions;
export default globalSlice.reducer;
